/**
 * Main entry point for the Ragie MCP Gateway
 * A gateway that demonstrates how to integrate with clients like Claude and OpenAI
 */

import { Gateway } from "./gateway";
import { Logger } from "./logger";

const logger = new Logger("Main");

async function main(): Promise<void> {
  try {
    logger.info("Starting Ragie MCP Gateway...");

    const gateway = new Gateway();
    await gateway.initialize();
    await gateway.start();

    logger.info("Ragie MCP Gateway started successfully");

    // Graceful shutdown handling
    process.on("SIGINT", async () => {
      logger.info("Received SIGINT, shutting down gracefully...");
      await gateway.stop();
      process.exit(0);
    });

    process.on("SIGTERM", async () => {
      logger.info("Received SIGTERM, shutting down gracefully...");
      await gateway.stop();
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

export { Gateway, Logger };
