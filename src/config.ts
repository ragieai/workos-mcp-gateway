import z from "zod";

export interface GatewayConfig {
  port: number;
  logLevel: "debug" | "info" | "warn" | "error";
  maxConnections: number;
  timeout: number;
  // OAuth configuration
  workosApiKey: string;
  workosClientId: string;
  workosCookiePassword: string;
  workosRedirectUri: string;
  workosOrganization: string;
  // Target MCP server configuration
  targetMcpServerUrl: string;
}

export function getConfigFromEnv(): GatewayConfig {
  const envVarSchema = z.object({
    PORT: z.coerce.number().default(3000),
    LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
    MAX_CONNECTIONS: z.coerce.number().default(100),
    TIMEOUT: z.coerce.number().default(30000),
    WORKOS_API_KEY: z.string(),
    WORKOS_CLIENT_ID: z.string(),
    WORKOS_COOKIE_PASSWORD: z.string(),
    WORKOS_REDIRECT_URI: z.string(),
    WORKOS_ORGANIZATION: z.string(),
    TARGET_MCP_SERVER_URL: z.string(),
  });

  const env = envVarSchema.parse(process.env);
  return {
    port: env.PORT,
    logLevel: env.LOG_LEVEL,
    maxConnections: env.MAX_CONNECTIONS,
    timeout: env.TIMEOUT,
    workosApiKey: env.WORKOS_API_KEY,
    workosClientId: env.WORKOS_CLIENT_ID,
    workosCookiePassword: env.WORKOS_COOKIE_PASSWORD,
    workosRedirectUri: env.WORKOS_REDIRECT_URI,
    workosOrganization: env.WORKOS_ORGANIZATION,
    targetMcpServerUrl: env.TARGET_MCP_SERVER_URL,
  };
}
