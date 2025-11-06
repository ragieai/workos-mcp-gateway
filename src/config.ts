import z from "zod";
import { readFileSync } from "fs";
import { resolve } from "path";
import { Logger } from "./logger.js";

export interface BaseConfig {
  baseUrl: string;
  port: number;
  logLevel: "debug" | "info" | "warn" | "error";
  ragieApiKey: string;
  ragieMcpServerUrl: string;
  workosApiKey: string;
  workosAuthorizationServerUrl: string;
  workosClientId: string;
  strictMapping: boolean;
}

export interface EnvironmentConfig extends BaseConfig {
  mappingFile?: string;
}

export interface GatewayConfig extends BaseConfig {
  mapping?: Record<string, string>;
}

function loadMappingFile(filePath: string, logger: Logger): Record<string, string> {
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
      throw new Error(`Mapping file validation failed: ${errorMessages}`);
    }
    if (error instanceof Error) {
      throw new Error(`Failed to load mapping file: ${error.message}`);
    }
    throw new Error(`Failed to load mapping file: ${String(error)}`);
  }
}

export function getConfigFromEnv(): GatewayConfig {
  const logger = new Logger("Config");

  const envVarSchema = z.object({
    BASE_URL: z.string(),
    PORT: z.coerce.number().default(3000),
    LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
    RAGIE_API_KEY: z.string(),
    RAGIE_MCP_SERVER_URL: z.string(),
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

  const baseConfig: BaseConfig = {
    baseUrl: env.BASE_URL,
    port: env.PORT,
    logLevel: env.LOG_LEVEL,
    ragieApiKey: env.RAGIE_API_KEY,
    ragieMcpServerUrl: env.RAGIE_MCP_SERVER_URL,
    workosApiKey: env.WORKOS_API_KEY,
    workosAuthorizationServerUrl: env.WORKOS_AUTHORIZATION_SERVER_URL,
    workosClientId: env.WORKOS_CLIENT_ID,
    strictMapping: env.STRICT_MAPPING,
  };

  if (env.STRICT_MAPPING && !env.MAPPING_FILE) {
    throw new Error("STRICT_MAPPING=true requires MAPPING_FILE to be specified");
  }

  if (env.MAPPING_FILE) {
    const mapping = loadMappingFile(env.MAPPING_FILE, logger);
    return { ...baseConfig, mapping };
  }

  return baseConfig;
}
