/**
 * Main entry point for the Ragie MCP Gateway
 * A gateway that demonstrates how to integrate with clients like Claude and OpenAI
 */

import dotenv from "dotenv";
import { Gateway } from "./gateway";
import { Logger } from "./logger";
import { getConfigFromEnv, GatewayConfig } from "./config";
import { readFileSync } from "fs";
import { resolve } from "path";
import minimist from "minimist";
import z from "zod";

// Load environment variables
dotenv.config();

const logger = new Logger("Main");
const gracefulShutdown = process.env["NODE_ENV"] === "development" ? false : true;

function parseCommandLineArgs(): { mappingFile?: string } {
  const args = minimist(process.argv.slice(2), {
    string: ["mapping-file", "m"],
    alias: { "mapping-file": ["mappingFile", "m"] },
  });

  return {
    mappingFile: args["mapping-file"] || args["m"],
  };
}

function loadMappingFile(filePath: string): Record<string, string> {
  try {
    const resolvedPath = resolve(filePath);
    logger.info(`Loading mapping file from: ${resolvedPath}`);
    const fileContents = readFileSync(resolvedPath, "utf-8");
    const rawData = JSON.parse(fileContents);

    const mappingSchema = z.record(z.string(), z.string());
    const mapping = mappingSchema.parse(rawData);

    logger.info(`Loaded ${Object.keys(mapping).length} organization mappings`);
    return mapping;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues.map(e => `${e.path.join(".")}: ${e.message}`).join(", ");
      logger.error(`Invalid mapping file format: ${errorMessages}`);
      throw new Error(`Mapping file validation failed: ${errorMessages}`);
    }
    logger.error(`Failed to load mapping file: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

async function main(): Promise<void> {
  try {
    logger.info("Starting MCP Gateway...");

    const baseConfig = getConfigFromEnv();
    const cliArgs = parseCommandLineArgs();

    let config: GatewayConfig = baseConfig;

    // Load mapping file if provided
    if (cliArgs.mappingFile) {
      const mapping = loadMappingFile(cliArgs.mappingFile);
      config = {
        ...baseConfig,
        mapping,
      };
    }

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
