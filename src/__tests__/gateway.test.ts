/**
 * Tests for the Gateway class
 */

import { Gateway } from "../gateway";

describe("Gateway", () => {
  let gateway: Gateway;

  beforeEach(() => {
    gateway = new Gateway({
      baseUrl: "http://localhost:3000",
      port: 3002,
      logLevel: "error", // Reduce log noise during tests
      ragieApiKey: "ragie_api_key",
      ragieMcpServerUrl: "ragie_mcp_server_url",
      workosApiKey: "workos_api_key",
      workosAuthorizationServerUrl: "https://placeholder.authkit.app",
      workosClientId: "workos_client_id",
    });
  });

  afterEach(async () => {
    if (gateway.isActive()) {
      await gateway.stop();
    }
  });

  describe("lifecycle", () => {
    it("should start and stop successfully", async () => {
      await gateway.start();
      expect(gateway.isActive()).toBe(true);

      await gateway.stop();
      expect(gateway.isActive()).toBe(false);
    });

    it("should not start if already running", async () => {
      await gateway.start();
      expect(gateway.isActive()).toBe(true);

      // Second start should not throw
      await expect(gateway.start()).resolves.not.toThrow();
    });

    it("should not stop if not running", async () => {
      await expect(gateway.stop()).resolves.not.toThrow();
    });
  });
});
