/**
 * Logger utility for the Ragie MCP Gateway
 * Uses Winston for logging
 */

import winston from "winston";

/**
 * Creates a Winston logger instance with the specified context and log level
 */
export function createLogger(
  context: string,
  logLevel: winston.LoggerOptions["level"] = "info",
  logFormat: "json" | "pretty" = "pretty"
): winston.Logger {
  const isJsonFormat = logFormat === "json";

  const baseFormat = winston.format.combine(winston.format.timestamp(), winston.format.errors({ stack: true }));

  const consoleFormat = isJsonFormat
    ? winston.format.combine(baseFormat, winston.format.json())
    : winston.format.combine(
        baseFormat,
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, context: ctx, ...metadata }) => {
          const contextStr = ctx ? `[${ctx}]` : "";
          const metadataStr = Object.keys(metadata).length > 0 ? ` ${JSON.stringify(metadata)}` : "";
          return `${timestamp} ${level} ${contextStr} ${message}${metadataStr}`;
        })
      );

  return winston.createLogger({
    level: logLevel,
    format: baseFormat,
    transports: [
      new winston.transports.Console({
        format: consoleFormat,
      }),
    ],
    defaultMeta: {
      context,
    },
  });
}
