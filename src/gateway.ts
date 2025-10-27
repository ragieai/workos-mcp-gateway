import { EventEmitter } from "events";
import express, { Request, Response, NextFunction } from "express";

import { WorkOS } from "@workos-inc/node";
import { Logger } from "./logger";
import { GatewayConfig } from "./config";
import z from "zod";
import cookieParser from "cookie-parser";
import { Server } from "http";
import { createProxyMiddleware } from "http-proxy-middleware";
import { jwtVerify, createRemoteJWKSet } from "jose";

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
    this.app.use(cookieParser());

    // Request logging middleware
    this.app.use((req: Request, _res: Response, next: NextFunction) => {
      this.logger.debug(`Incoming request: ${req.method} ${req.url}`);
      next();
    });

    this.app.get("/auth/login", this.handleLogin.bind(this));
    this.app.get("/auth/callback", this.handleAuthCallback.bind(this));
    this.app.get("/auth/logout", this.handleLogout.bind(this));

    const proxyMiddleware = createProxyMiddleware({
      target: this.config.ragieMcpServerUrl,
      changeOrigin: true,
      on: {
        proxyReq: (req, res) => {
          req.setHeader("Authorization", `Bearer ${this.config.ragieApiKey}`);
        },
      },
    });

    this.app.use("/mcp", this.bearerTokenMiddleware.bind(this), proxyMiddleware);
    this.app.get("/.well-known/oauth-protected-resource", (req, res) =>
      res.json({
        resource: `${this.config.baseUrl}/mcp`,
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

  async bearerTokenMiddleware(req: Request, res: Response, next: NextFunction) {
    const token = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
    if (!token) {
      res.set("WWW-Authenticate", this.wwwAuthenticateHeader).status(401).json({ error: "No token provided." });
      return;
    }

    try {
      const { payload } = await jwtVerify(token, this.workosJwks, {
        issuer: this.config.workosAuthorizationServerUrl,
      });

      // Use access token claims to populate request context.
      // i.e. `req.userId = payload.sub;`

      next();
    } catch (err) {
      res.set("WWW-Authenticate", this.wwwAuthenticateHeader).status(401).json({ error: "Invalid bearer token." });
    }
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

  private async handleLogin(_req: Request, res: Response): Promise<void> {
    const authorizationUrl = this.workos.sso.getAuthorizationUrl({
      organization: this.config.workosOrganization,
      redirectUri: this.config.workosRedirectUri,
      clientId: this.config.workosClientId,
    });

    res.redirect(authorizationUrl);
  }

  private async handleAuthCallback(req: Request, res: Response): Promise<void> {
    const result = z.string().safeParse(req.query["code"]);

    if (!result.success) {
      res.status(400).send("No code provided");
      return;
    }

    const code = result.data;

    try {
      const authenticateResponse = await this.workos.userManagement.authenticateWithCode({
        clientId: this.config.workosClientId,
        code,
        session: {
          sealSession: true,
          cookiePassword: this.config.workosCookiePassword,
        },
      });

      const { user, sealedSession } = authenticateResponse;

      console.log({ user });

      // Store the session in a cookie
      res.cookie("wos-session", sealedSession, {
        path: "/",
        httpOnly: true,
        secure: true,
        sameSite: "lax",
      });

      // Use the information in `user` for further business logic.

      // Redirect the user to the homepage
      res.redirect("/mcp");
      return;
    } catch (error) {
      console.log({ error });
      res.redirect("/auth/login");
      return;
    }
  }

  private async handleLogout(req: Request, res: Response): Promise<void> {
    if (!req.cookies["wos-session"]) {
      res.send("Already logged out");
      return;
    }

    const session = this.workos.userManagement.loadSealedSession({
      sessionData: req.cookies["wos-session"],
      cookiePassword: this.config.workosCookiePassword,
    });

    res.clearCookie("wos-session");
    res.send("Logged out successfully");
  }

  // Authentication middleware
  private async authenticateRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    const session = this.workos.userManagement.loadSealedSession({
      sessionData: req.cookies["wos-session"],
      cookiePassword: this.config.workosCookiePassword,
    });

    const auth = await session.authenticate();

    if (auth.authenticated) {
      return next();
    }

    // If the cookie is missing, redirect to login
    if (!auth.authenticated && auth.reason === "no_session_cookie_provided") {
      return res.redirect("/auth/login");
    }

    // If the session is invalid, attempt to refresh
    try {
      const auth = await session.refresh();

      if (!auth.authenticated) {
        return res.redirect("/auth/login");
      }

      // update the cookie
      res.cookie("wos-session", auth.sealedSession, {
        path: "/",
        httpOnly: true,
        secure: true,
        sameSite: "lax",
      });

      // Redirect to the same route to ensure the updated cookie is used
      return res.redirect(req.originalUrl);
    } catch (e) {
      // Failed to refresh access token, redirect user to login page
      // after deleting the cookie
      res.clearCookie("wos-session");
      res.redirect("/auth/login");
    }
  }
}
