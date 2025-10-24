/**
 * Type definitions for the Ragie MCP Gateway
 */

export interface MCPRequest {
  id: string;
  method: string;
  params?: Record<string, unknown>;
  timestamp: Date;
}

export interface MCPResponse {
  id: string;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
  timestamp: Date;
}

export interface GatewayConfig {
  port: number;
  host: string;
  logLevel: "debug" | "info" | "warn" | "error";
  maxConnections: number;
  timeout: number;
}

export interface ClientConnection {
  id: string;
  type: "claude" | "openai" | "other";
  connectedAt: Date;
  lastActivity: Date;
  isActive: boolean;
}

export interface GatewayStats {
  totalConnections: number;
  activeConnections: number;
  totalRequests: number;
  uptime: number;
  memoryUsage: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
    arrayBuffers: number;
  };
}

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: string;
  metadata?: Record<string, unknown>;
}
