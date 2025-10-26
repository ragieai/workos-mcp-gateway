/**
 * Logger utility for the Ragie MCP Gateway
 */

export class Logger {
  private context: string;
  private logLevel: LogLevel;

  constructor(context: string, logLevel: LogLevel = "info") {
    this.context = context;
    this.logLevel = logLevel;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    };
    return levels[level] >= levels[this.logLevel];
  }

  private formatLog(level: LogLevel, message: string, metadata?: Record<string, unknown>): LogEntry {
    return {
      level,
      message,
      timestamp: new Date(),
      context: this.context,
      ...(metadata && { metadata }),
    };
  }

  private output(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) return;

    const timestamp = entry.timestamp.toISOString();
    const context = entry.context ? `[${entry.context}]` : "";
    const metadata = entry.metadata ? ` ${JSON.stringify(entry.metadata)}` : "";

    const logMessage = `${timestamp} ${entry.level.toUpperCase()} ${context} ${entry.message}${metadata}`;

    switch (entry.level) {
      case "debug":
        console.debug(logMessage);
        break;
      case "info":
        console.log(logMessage);
        break;
      case "warn":
        console.warn(logMessage);
        break;
      case "error":
        console.error(logMessage);
        break;
    }
  }

  debug(message: string, metadata?: Record<string, unknown>): void {
    this.output(this.formatLog("debug", message, metadata));
  }

  info(message: string, metadata?: Record<string, unknown>): void {
    this.output(this.formatLog("info", message, metadata));
  }

  warn(message: string, metadata?: Record<string, unknown>): void {
    this.output(this.formatLog("warn", message, metadata));
  }

  error(message: string, error?: unknown, metadata?: Record<string, unknown>): void {
    const errorMetadata =
      error instanceof Error
        ? { error: error.message, stack: error.stack, ...metadata }
        : { error: String(error), ...metadata };

    this.output(this.formatLog("error", message, errorMetadata));
  }

  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }
}

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: string;
  metadata?: Record<string, unknown>;
}
