/**
 * Main Gateway class for the Ragie MCP Gateway
 */

import { EventEmitter } from "events";
import { Logger } from "./logger";
import {
  GatewayConfig,
  ClientConnection,
  GatewayStats,
  MCPRequest,
  MCPResponse,
} from "./types";

export class Gateway extends EventEmitter {
  private logger: Logger;
  private config: GatewayConfig;
  private connections: Map<string, ClientConnection>;
  private isRunning: boolean;
  private startTime: Date | null;

  constructor(config?: Partial<GatewayConfig>) {
    super();

    this.config = {
      port: 3000,
      host: "localhost",
      logLevel: "info",
      maxConnections: 100,
      timeout: 30000,
      ...config,
    };

    this.logger = new Logger("Gateway", this.config.logLevel);
    this.connections = new Map();
    this.isRunning = false;
    this.startTime = null;
  }

  async initialize(): Promise<void> {
    this.logger.info("Initializing Gateway...");

    // Initialize any required services here
    this.logger.info("Gateway initialized successfully");
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn("Gateway is already running");
      return;
    }

    this.logger.info(
      `Starting Gateway on ${this.config.host}:${this.config.port}`
    );

    this.isRunning = true;
    this.startTime = new Date();

    this.emit("started");
    this.logger.info("Gateway started successfully");
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      this.logger.warn("Gateway is not running");
      return;
    }

    this.logger.info("Stopping Gateway...");

    // Close all connections
    for (const [id] of this.connections) {
      await this.closeConnection(id);
    }

    this.isRunning = false;
    this.startTime = null;

    this.emit("stopped");
    this.logger.info("Gateway stopped successfully");
  }

  async processRequest(request: MCPRequest): Promise<MCPResponse> {
    this.logger.debug("Processing request", {
      requestId: request.id,
      method: request.method,
    });

    try {
      // Simulate request processing
      const result = await this.handleRequest(request);

      const response: MCPResponse = {
        id: request.id,
        result,
        timestamp: new Date(),
      };

      this.logger.debug("Request processed successfully", {
        requestId: request.id,
      });
      return response;
    } catch (error) {
      this.logger.error("Error processing request", error, {
        requestId: request.id,
      });

      const response: MCPResponse = {
        id: request.id,
        error: {
          code: 500,
          message: error instanceof Error ? error.message : "Unknown error",
        },
        timestamp: new Date(),
      };

      return response;
    }
  }

  private async handleRequest(request: MCPRequest): Promise<unknown> {
    // Implement specific request handling logic here
    switch (request.method) {
      case "ping":
        return { message: "pong", timestamp: new Date() };

      case "getStats":
        return this.getStats();

      case "getConnections":
        return Array.from(this.connections.values());

      default:
        throw new Error(`Unknown method: ${request.method}`);
    }
  }

  addConnection(connection: ClientConnection): void {
    this.connections.set(connection.id, connection);
    this.logger.info("New connection added", {
      connectionId: connection.id,
      type: connection.type,
    });
    this.emit("connectionAdded", connection);
  }

  removeConnection(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (connection) {
      this.connections.delete(connectionId);
      this.logger.info("Connection removed", { connectionId });
      this.emit("connectionRemoved", connection);
    }
  }

  private async closeConnection(connectionId: string): Promise<void> {
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.isActive = false;
      this.logger.debug("Connection closed", { connectionId });
      this.emit("connectionClosed", connection);
    }
  }

  getStats(): GatewayStats {
    const activeConnections = Array.from(this.connections.values()).filter(
      conn => conn.isActive
    ).length;

    const uptime = this.startTime ? Date.now() - this.startTime.getTime() : 0;

    return {
      totalConnections: this.connections.size,
      activeConnections,
      totalRequests: 0, // This would be tracked in a real implementation
      uptime,
      memoryUsage: process.memoryUsage(),
    };
  }

  getConfig(): GatewayConfig {
    return { ...this.config };
  }

  isActive(): boolean {
    return this.isRunning;
  }
}
