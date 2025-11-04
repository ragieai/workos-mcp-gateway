import z from "zod";

export interface GatewayConfig {
  baseUrl: string;
  port: number;
  logLevel: "debug" | "info" | "warn" | "error";
  ragieApiKey: string;
  ragieMcpServerUrl: string;
  workosApiKey: string;
  workosAuthorizationServerUrl: string;
  workosClientId: string;
  mapping?: Record<string, string>;
  strictMapping?: boolean;
}

export function getConfigFromEnv(): GatewayConfig {
  const envVarSchema = z.object({
    BASE_URL: z.string(),
    PORT: z.coerce.number().default(3000),
    LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
    RAGIE_API_KEY: z.string(),
    RAGIE_MCP_SERVER_URL: z.string(),
    WORKOS_API_KEY: z.string(),
    WORKOS_AUTHORIZATION_SERVER_URL: z.string(),
    WORKOS_CLIENT_ID: z.string(),
  });

  const env = envVarSchema.parse(process.env);

  return {
    baseUrl: env.BASE_URL,
    port: env.PORT,
    logLevel: env.LOG_LEVEL,
    ragieApiKey: env.RAGIE_API_KEY,
    ragieMcpServerUrl: env.RAGIE_MCP_SERVER_URL,
    workosApiKey: env.WORKOS_API_KEY,
    workosAuthorizationServerUrl: env.WORKOS_AUTHORIZATION_SERVER_URL,
    workosClientId: env.WORKOS_CLIENT_ID,
  };
}
