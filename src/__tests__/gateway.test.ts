/**
 * Tests for the Gateway class
 */

import { Gateway } from "../gateway";
import { MCPRequest } from "../types";

describe("Gateway", () => {
  let gateway: Gateway;

  beforeEach(() => {
    gateway = new Gateway({
      port: 3001,
      host: "localhost",
      logLevel: "error", // Reduce log noise during tests
    });
  });

  afterEach(async () => {
    if (gateway.isActive()) {
      await gateway.stop();
    }
  });

  describe("initialization", () => {
    it("should initialize successfully", async () => {
      await expect(gateway.initialize()).resolves.not.toThrow();
    });

    it("should not be running before start", () => {
      expect(gateway.isActive()).toBe(false);
    });
  });

  describe("lifecycle", () => {
    it("should start and stop successfully", async () => {
      await gateway.initialize();
      await gateway.start();
      expect(gateway.isActive()).toBe(true);

      await gateway.stop();
      expect(gateway.isActive()).toBe(false);
    });

    it("should not start if already running", async () => {
      await gateway.initialize();
      await gateway.start();
      expect(gateway.isActive()).toBe(true);

      // Second start should not throw
      await expect(gateway.start()).resolves.not.toThrow();
    });

    it("should not stop if not running", async () => {
      await expect(gateway.stop()).resolves.not.toThrow();
    });
  });

  describe("request processing", () => {
    beforeEach(async () => {
      await gateway.initialize();
      await gateway.start();
    });

    it("should process ping request", async () => {
      const request: MCPRequest = {
        id: "test-1",
        method: "ping",
        timestamp: new Date(),
      };

      const response = await gateway.processRequest(request);

      expect(response.id).toBe("test-1");
      expect(response.result).toBeDefined();
      expect(response.error).toBeUndefined();
    });

    it("should process getStats request", async () => {
      const request: MCPRequest = {
        id: "test-2",
        method: "getStats",
        timestamp: new Date(),
      };

      const response = await gateway.processRequest(request);

      expect(response.id).toBe("test-2");
      expect(response.result).toBeDefined();
      expect(response.error).toBeUndefined();
    });

    it("should handle unknown method", async () => {
      const request: MCPRequest = {
        id: "test-3",
        method: "unknown",
        timestamp: new Date(),
      };

      const response = await gateway.processRequest(request);

      expect(response.id).toBe("test-3");
      expect(response.result).toBeUndefined();
      expect(response.error).toBeDefined();
      expect(response.error?.message).toContain("Unknown method");
    });
  });

  describe("configuration", () => {
    it("should return configuration", () => {
      const config = gateway.getConfig();
      expect(config).toBeDefined();
      expect(config.port).toBe(3001);
      expect(config.host).toBe("localhost");
    });
  });
});
