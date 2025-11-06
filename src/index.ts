#!/usr/bin/env node
/**
 * Main entry point for the Ragie MCP Gateway
 * A gateway that demonstrates how to integrate with clients like Claude and OpenAI
 */

import dotenv from "dotenv";
import { Gateway } from "./gateway.js";
import { Logger } from "./logger.js";
import { getConfigFromEnv } from "./config.js";
import { fileURLToPath } from "url";

// Load environment variables
dotenv.config();

const logger = new Logger("Main");
const gracefulShutdown = process.env["NODE_ENV"] === "development" ? false : true;

async function main(): Promise<void> {
  logger.info("Starting MCP Gateway...");

  const config = getConfigFromEnv();
  const gateway = new Gateway(config);
  await gateway.start();

  logger.info("MCP Gateway started successfully");

  process.on("SIGINT", async () => {
    if (gracefulShutdown) {
      logger.info("Received SIGINT, shutting down gracefully...");
      await gateway.stop();
    } else {
      logger.info("Received SIGINT, shutting down immediately...");
    }
    process.exit(0);
  });
}

// Start the application
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch(error => {
    logger.error(error);
    process.exit(1);
  });
}
