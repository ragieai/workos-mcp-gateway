import z from "zod";
import { readFileSync } from "fs";
import { resolve } from "path";
import { createLogger } from "./logger.js";
import type winston from "winston";

export interface Config {
  baseUrl: string;
  port: number;
  logLevel: "debug" | "info" | "warn" | "error";
  logFormat: "json" | "pretty";
  mappingFile: string | undefined;
  ragieApiKey: string;
  ragieBaseUrl: string;
  strictApiKeys: boolean;
  strictMapping: boolean;
  workosApiKey: string;
  workosAuthorizationServerUrl: string;
  workosClientId: string;
}

const booleanSchema = z.preprocess(val => {
  if (val === undefined || val === "") return false;
  const str = String(val).toLowerCase();
  return str === "true" || str === "1";
}, z.boolean().default(false));

export function getConfigFromEnv(): Config {
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
    STRICT_API_KEYS: booleanSchema,
    STRICT_MAPPING: booleanSchema,
  });

  const env = envVarSchema.parse(process.env);

  // Default BASE_URL to localhost with the configured port if not provided
  const baseUrl = env.BASE_URL || `http://localhost:${env.PORT}`;

  const config: Config = {
    baseUrl,
    port: env.PORT,
    logLevel: env.LOG_LEVEL,
    logFormat: env.LOG_FORMAT,
    mappingFile: env.MAPPING_FILE,
    ragieApiKey: env.RAGIE_API_KEY,
    ragieBaseUrl: env.RAGIE_BASE_URL,
    strictApiKeys: env.STRICT_API_KEYS,
    strictMapping: env.STRICT_MAPPING,
    workosApiKey: env.WORKOS_API_KEY,
    workosAuthorizationServerUrl: env.WORKOS_AUTHORIZATION_SERVER_URL,
    workosClientId: env.WORKOS_CLIENT_ID,
  };

  if (env.STRICT_MAPPING && !env.MAPPING_FILE) {
    throw new Error("STRICT_MAPPING=true requires MAPPING_FILE to be specified");
  }
  return config;
}
