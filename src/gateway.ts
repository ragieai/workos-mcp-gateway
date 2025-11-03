import { EventEmitter } from "events";
import express, { Request, Response, NextFunction } from "express";

import { WorkOS } from "@workos-inc/node";
import { Logger } from "./logger";
import { GatewayConfig } from "./config";
import { Server } from "http";
import { createProxyMiddleware } from "http-proxy-middleware";
import { jwtVerify, createRemoteJWKSet } from "jose";
import assert from "assert";

export class Gateway extends EventEmitter {
  private logger: Logger;
  private config: GatewayConfig;
  private isRunning: boolean;
  private app: express.Application;
  private server: Server | null;
  private workos: WorkOS;
  private wwwAuthenticateHeader: string;
  private workosJwks: ReturnType<typeof createRemoteJWKSet>;

  constructor(config: GatewayConfig, workos: WorkOS | null = null) {
    super();

    this.config = config;

    this.logger = new Logger("Gateway", this.config.logLevel);
    this.isRunning = false;
    this.server = null;

    this.workos =
      workos ??
      new WorkOS(this.config.workosApiKey, {
        clientId: this.config.workosClientId,
      });

    this.wwwAuthenticateHeader = [
      'Bearer error="unauthorized"',
      'error_description="Authorization needed"',
      `resource_metadata="${this.config.baseUrl}/.well-known/oauth-protected-resource"`,
    ].join(", ");

    this.workosJwks = createRemoteJWKSet(new URL(this.config.workosAuthorizationServerUrl + "/oauth2/jwks"));

    this.app = express();
    this.initializeApp();
  }

  private initializeApp(): void {
    this.app.use((req: Request, _res: Response, next: NextFunction) => {
      this.logger.debug(`Incoming request: ${req.method} ${req.url}`);
      next();
    });

    const proxyMiddleware = createProxyMiddleware({
      target: this.config.ragieMcpServerUrl,
      changeOrigin: true,
      on: {
        proxyReq: req => {
          req.setHeader("Authorization", `Bearer ${this.config.ragieApiKey}`);
        },
      },
    });

    this.app.use("/:organizationId/mcp", this.bearerTokenMiddleware.bind(this), proxyMiddleware);

    this.app.get("/.well-known/oauth-protected-resource", (req, res) =>
      res.json({
        resource: `${this.config.baseUrl}/`,
        authorization_servers: [this.config.workosAuthorizationServerUrl],
        bearer_methods_supported: ["header"],
      })
    );

    this.app.get("/.well-known/oauth-authorization-server", async (_req, res) => {
      const response = await fetch(
        `${this.config.workosAuthorizationServerUrl}/.well-known/oauth-authorization-server`
      );
      const metadata = await response.json();

      res.json(metadata);
    });
  }

  async bearerTokenMiddleware(req: Request<{ organizationId: string }>, res: Response, next: NextFunction) {
    const organizationId = req.params.organizationId;
    assert(organizationId, "Organization ID is required.");

    const token = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
    let userId: string | undefined;

    if (!token) {
      res.set("WWW-Authenticate", this.wwwAuthenticateHeader).status(401).json({ error: "No token provided." });
      return;
    }

    try {
      const { payload } = await jwtVerify(token, this.workosJwks, {
        issuer: this.config.workosAuthorizationServerUrl,
      });
      userId = payload.sub;
    } catch {
      res.set("WWW-Authenticate", this.wwwAuthenticateHeader).status(401).json({ error: "Invalid bearer token." });
    }
    assert(userId, "User ID is required in the JWT payload"); // type narrowing for userId

    // FIXME: This is a workaround because the WorkOS JWT does not include the organization ID.
    // As a result, this request needs to be made to validate the users membership in the organization.
    const response = await this.workos.userManagement.listOrganizationMemberships({
      userId,
      organizationId,
      statuses: ["active"],
    });

    if (response.data.length === 0) {
      this.logger.warn(`User ${userId} is not a member of the organization ${organizationId}`);
      res.set("WWW-Authenticate", this.wwwAuthenticateHeader).status(401).json({ error: "Invalid bearer token." });
    }

    next();
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn("Gateway is already running");
      return;
    }

    this.logger.info(`Starting Gateway on port ${this.config.port}`);

    return new Promise((resolve, reject) => {
      this.server = this.app.listen(this.config.port, (error?: Error) => {
        if (error) {
          this.logger.error("Failed to start server:", error);
          reject(error);
          return;
        }

        this.isRunning = true;

        this.emit("started");
        this.logger.info("Gateway started successfully");
        resolve();
      });
    });
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      this.logger.warn("Gateway is not running");
      return;
    }

    this.logger.info("Stopping Gateway...");

    return new Promise(resolve => {
      if (this.server) {
        if (this.server.listening) {
          this.server.close((error?: Error) => {
            if (error) {
              this.logger.error("Failed to stop server:", error);
              resolve(void 0);
              return;
            }

            this.isRunning = false;
            this.emit("stopped");
            this.logger.info("Gateway stopped successfully");
            resolve(void 0);
          });
        }
      } else {
        this.isRunning = false;
        this.emit("stopped");
        this.logger.info("Gateway stopped successfully");
        resolve(void 0);
      }
    });
  }

  getConfig(): GatewayConfig {
    return { ...this.config };
  }

  isActive(): boolean {
    return this.isRunning;
  }
}
