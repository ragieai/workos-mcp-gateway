/**
 * Main entry point for the Ragie MCP Gateway
 * A gateway that demonstrates how to integrate with clients like Claude and OpenAI
 */

import dotenv from "dotenv";
import { Gateway } from "./gateway";
import { Logger } from "./logger";
import { getConfigFromEnv } from "./config";

// Load environment variables
dotenv.config();

const logger = new Logger("Main");
const config = getConfigFromEnv();
const gracefulShutdown = process.env["NODE_ENV"] === "development" ? false : true;

async function main(): Promise<void> {
  try {
    logger.info("Starting MCP Gateway...");

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
  } catch (error) {
    logger.error("Failed to start Ragie MCP Gateway:", error);
    process.exit(1);
  }
}

// Start the application
if (require.main === module) {
  main().catch(error => {
    logger.error("Unhandled error in main:", error);
    process.exit(1);
  });
}
