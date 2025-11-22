import z from "zod";
import { readFileSync } from "fs";
import { resolve } from "path";
import { createLogger } from "./logger.js";
import type winston from "winston";

export interface BaseConfig {
  baseUrl: string;
  port: number;
  logLevel: "debug" | "info" | "warn" | "error";
  logFormat: "json" | "pretty";
  ragieApiKey: string;
  ragieBaseUrl: string;
  workosApiKey: string;
  workosAuthorizationServerUrl: string;
  workosClientId: string;
  strictMapping: boolean;
}

export interface EnvironmentConfig extends BaseConfig {
  mappingFile?: string;
}

const MappingSchema = z.record(
  z.string(),
  z.object({
    partition: z.string(),
    apiKey: z.string().optional(),
  })
);

export interface GatewayConfig extends BaseConfig {
  mapping?: z.infer<typeof MappingSchema>;
}

function loadMappingFile(filePath: string, logger: winston.Logger): z.infer<typeof MappingSchema> {
  try {
    const resolvedPath = resolve(filePath);
    logger.info(`Loading mapping file from: ${resolvedPath}`);
    const fileContents = readFileSync(resolvedPath, "utf-8");
    const rawData = JSON.parse(fileContents);

    const mapping = MappingSchema.parse(rawData);

    logger.info(`Loaded ${Object.keys(mapping).length} organization mappings`);
    return mapping;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues.map(e => `${e.path.join(".")}: ${e.message}`).join(", ");
      throw new Error(`Mapping file validation failed: ${errorMessages}`);
    }
    if (error instanceof Error) {
      throw new Error(`Failed to load mapping file: ${error.message}`);
    }
    throw new Error(`Failed to load mapping file: ${String(error)}`);
  }
}

export function getConfigFromEnv(): GatewayConfig {
  const envVarSchema = z.object({
    BASE_URL: z.string().optional(),
    PORT: z.coerce.number().default(3000),
    LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
    LOG_FORMAT: z.enum(["json", "pretty"]).default("pretty"),
    RAGIE_API_KEY: z.string(),
    RAGIE_BASE_URL: z.string().default("https://api.ragie.ai/"),
    WORKOS_API_KEY: z.string(),
    WORKOS_AUTHORIZATION_SERVER_URL: z.string(),
    WORKOS_CLIENT_ID: z.string(),
    MAPPING_FILE: z.string().optional(),
    STRICT_MAPPING: z.preprocess(val => {
      if (val === undefined || val === "") return false;
      const str = String(val).toLowerCase();
      return str === "true" || str === "1";
    }, z.boolean().default(false)),
  });

  const env = envVarSchema.parse(process.env);

  // Default BASE_URL to localhost with the configured port if not provided
  const baseUrl = env.BASE_URL || `http://localhost:${env.PORT}`;

  const baseConfig: BaseConfig = {
    baseUrl,
    port: env.PORT,
    logLevel: env.LOG_LEVEL,
    logFormat: env.LOG_FORMAT,
    ragieApiKey: env.RAGIE_API_KEY,
    ragieBaseUrl: env.RAGIE_BASE_URL,
    workosApiKey: env.WORKOS_API_KEY,
    workosAuthorizationServerUrl: env.WORKOS_AUTHORIZATION_SERVER_URL,
    workosClientId: env.WORKOS_CLIENT_ID,
    strictMapping: env.STRICT_MAPPING,
  };

  if (env.STRICT_MAPPING && !env.MAPPING_FILE) {
    throw new Error("STRICT_MAPPING=true requires MAPPING_FILE to be specified");
  }

  const logger = createLogger("Config", baseConfig.logLevel, baseConfig.logFormat);

  if (env.MAPPING_FILE) {
    const mapping = loadMappingFile(env.MAPPING_FILE, logger);
    return { ...baseConfig, mapping };
  }

  return baseConfig;
}
