/**
 * Tests for DefaultMapper and StrictMapper classes
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { DefaultMapper, StrictMapper } from "../mapping.js";

// Mock fs module
jest.mock("fs", () => ({
  readFileSync: jest.fn(),
}));

// Mock path module
jest.mock("path", () => ({
  resolve: jest.fn(path => path),
}));

describe("DefaultMapper", () => {
  const mockConfig = {
    ragieApiKey: "default-ragie-key",
    strictApiKeys: false,
  };

  describe("constructor and basic functionality", () => {
    it("should create instance with empty mapping", () => {
      const mapper = new DefaultMapper(mockConfig, {});
      expect(mapper).toBeInstanceOf(DefaultMapper);
    });

    it("should create instance with mapping", () => {
      const mapping = {
        org1: { partition: "partition1", apiKey: "key1" },
      };
      const mapper = new DefaultMapper(mockConfig, mapping);
      expect(mapper.hasMapping("org1")).toBe(true);
    });
  });

  describe("hasMapping", () => {
    it("should always return true", () => {
      const mapper = new DefaultMapper(mockConfig, {});
      expect(mapper.hasMapping("org1")).toBe(true);
    });
  });

  describe("getPartition", () => {
    it("should return partition when organization exists", () => {
      const mapping = {
        org1: { partition: "partition1" },
      };
      const mapper = new DefaultMapper(mockConfig, mapping);
      expect(mapper.getPartition("org1")).toBe("partition1");
    });

    it("should return lowercase organizationId when not found", () => {
      const mapper = new DefaultMapper(mockConfig, {});
      expect(mapper.getPartition("ORG123")).toBe("org123");
    });

    it("should return lowercase organizationId for mixed case", () => {
      const mapper = new DefaultMapper(mockConfig, {});
      expect(mapper.getPartition("MyOrg")).toBe("myorg");
    });
  });

  describe("getApiKey", () => {
    describe("when organization exists in mapping", () => {
      it("should return apiKey from mapping when present", () => {
        const mapping = {
          org1: { partition: "partition1", apiKey: "custom-key" },
        };
        const mapper = new DefaultMapper(mockConfig, mapping);
        expect(mapper.getApiKey("org1")).toBe("custom-key");
      });

      it("should return ragieApiKey when apiKey is missing and strictApiKeys is false", () => {
        const mapping = {
          org1: { partition: "partition1" },
        };
        const mapper = new DefaultMapper(mockConfig, mapping);
        expect(mapper.getApiKey("org1")).toBe("default-ragie-key");
      });

      it("should throw error when apiKey is missing and strictApiKeys is true", () => {
        const strictConfig = {
          ragieApiKey: "default-ragie-key",
          strictApiKeys: true,
        };
        const mapping = {
          org1: { partition: "partition1" },
        };
        const mapper = new DefaultMapper(strictConfig, mapping);
        expect(() => mapper.getApiKey("org1")).toThrow("Organization org1 has no API key in mapping");
      });

      it("should return apiKey when present and strictApiKeys is true", () => {
        const strictConfig = {
          ragieApiKey: "default-ragie-key",
          strictApiKeys: true,
        };
        const mapping = {
          org1: { partition: "partition1", apiKey: "custom-key" },
        };
        const mapper = new DefaultMapper(strictConfig, mapping);
        expect(mapper.getApiKey("org1")).toBe("custom-key");
      });
    });

    describe("when organization does not exist", () => {
      it("should return ragieApiKey when organization not found", () => {
        const mapper = new DefaultMapper(mockConfig, {});
        expect(mapper.getApiKey("nonexistent")).toBe("default-ragie-key");
      });

      it("should return ragieApiKey even when strictApiKeys is true", () => {
        const strictConfig = {
          ragieApiKey: "default-ragie-key",
          strictApiKeys: true,
        };
        const mapper = new DefaultMapper(strictConfig, {});
        // When organization doesn't exist, it returns ragieApiKey (not strict)
        expect(mapper.getApiKey("nonexistent")).toBe("default-ragie-key");
      });
    });
  });

  describe("load", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should load mapper from JSON file", () => {
      const mockMapping = {
        org1: { partition: "partition1", apiKey: "key1" },
        org2: { partition: "partition2" },
      };
      (readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockMapping));

      const mapper = DefaultMapper.load(mockConfig, "/path/to/mapping.json");

      expect(readFileSync).toHaveBeenCalledWith("/path/to/mapping.json", "utf-8");
      expect(mapper).toBeInstanceOf(DefaultMapper);
      expect(mapper.hasMapping("org1")).toBe(true);
      expect(mapper.hasMapping("org2")).toBe(true);
    });

    it("should throw error when file read fails", () => {
      (readFileSync as jest.Mock).mockImplementation(() => {
        throw new Error("File not found");
      });

      expect(() => DefaultMapper.load(mockConfig, "/nonexistent.json")).toThrow("Failed to read JSON file");
    });

    it("should throw error when JSON is invalid", () => {
      (readFileSync as jest.Mock).mockReturnValue("invalid json");

      expect(() => DefaultMapper.load(mockConfig, "/path/to/mapping.json")).toThrow();
    });

    it("should throw error when JSON schema is invalid", () => {
      const invalidMapping = {
        org1: { invalidField: "value" },
      };
      (readFileSync as jest.Mock).mockReturnValue(JSON.stringify(invalidMapping));

      expect(() => DefaultMapper.load(mockConfig, "/path/to/mapping.json")).toThrow();
    });
  });
});

describe("StrictMapper", () => {
  const mockConfig = {
    ragieApiKey: "default-ragie-key",
    strictApiKeys: false,
  };

  describe("constructor and basic functionality", () => {
    it("should create instance with empty mapping", () => {
      const mapper = new StrictMapper(mockConfig, {});
      expect(mapper).toBeInstanceOf(StrictMapper);
    });

    it("should create instance with mapping", () => {
      const mapping = {
        org1: { partition: "partition1", apiKey: "key1" },
      };
      const mapper = new StrictMapper(mockConfig, mapping);
      expect(mapper.hasMapping("org1")).toBe(true);
    });
  });

  describe("hasMapping", () => {
    it("should return true when organization exists in mapping", () => {
      const mapping = {
        org1: { partition: "partition1" },
      };
      const mapper = new StrictMapper(mockConfig, mapping);
      expect(mapper.hasMapping("org1")).toBe(true);
    });

    it("should return false when organization does not exist", () => {
      const mapper = new StrictMapper(mockConfig, {});
      expect(mapper.hasMapping("nonexistent")).toBe(false);
    });
  });

  describe("getPartition", () => {
    it("should return partition when organization exists", () => {
      const mapping = {
        org1: { partition: "partition1" },
      };
      const mapper = new StrictMapper(mockConfig, mapping);
      expect(mapper.getPartition("org1")).toBe("partition1");
    });

    it("should throw error when organization not found", () => {
      const mapper = new StrictMapper(mockConfig, {});
      expect(() => mapper.getPartition("nonexistent")).toThrow("Organization nonexistent not found in mapping");
    });
  });

  describe("getApiKey", () => {
    describe("when organization exists in mapping", () => {
      it("should return apiKey from mapping when present", () => {
        const mapping = {
          org1: { partition: "partition1", apiKey: "custom-key" },
        };
        const mapper = new StrictMapper(mockConfig, mapping);
        expect(mapper.getApiKey("org1")).toBe("custom-key");
      });

      it("should return ragieApiKey when apiKey is missing and strictApiKeys is false", () => {
        const mapping = {
          org1: { partition: "partition1" },
        };
        const mapper = new StrictMapper(mockConfig, mapping);
        expect(mapper.getApiKey("org1")).toBe("default-ragie-key");
      });

      it("should throw error when apiKey is missing and strictApiKeys is true", () => {
        const strictConfig = {
          ragieApiKey: "default-ragie-key",
          strictApiKeys: true,
        };
        const mapping = {
          org1: { partition: "partition1" },
        };
        const mapper = new StrictMapper(strictConfig, mapping);
        expect(() => mapper.getApiKey("org1")).toThrow("Organization org1 has no API key in mapping");
      });

      it("should return apiKey when present and strictApiKeys is true", () => {
        const strictConfig = {
          ragieApiKey: "default-ragie-key",
          strictApiKeys: true,
        };
        const mapping = {
          org1: { partition: "partition1", apiKey: "custom-key" },
        };
        const mapper = new StrictMapper(strictConfig, mapping);
        expect(mapper.getApiKey("org1")).toBe("custom-key");
      });
    });

    describe("when organization does not exist", () => {
      it("should throw error when organization not found", () => {
        const mapper = new StrictMapper(mockConfig, {});
        expect(() => mapper.getApiKey("nonexistent")).toThrow("Organization nonexistent not found in mapping");
      });

      it("should throw error even when strictApiKeys is false", () => {
        const mapper = new StrictMapper(mockConfig, {});
        expect(() => mapper.getApiKey("nonexistent")).toThrow("Organization nonexistent not found in mapping");
      });
    });
  });

  describe("load", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should load mapper from JSON file", () => {
      const mockMapping = {
        org1: { partition: "partition1", apiKey: "key1" },
        org2: { partition: "partition2" },
      };
      (readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockMapping));

      const mapper = StrictMapper.load(mockConfig, "/path/to/mapping.json");

      expect(readFileSync).toHaveBeenCalledWith("/path/to/mapping.json", "utf-8");
      expect(mapper).toBeInstanceOf(StrictMapper);
      expect(mapper.hasMapping("org1")).toBe(true);
      expect(mapper.hasMapping("org2")).toBe(true);
    });

    it("should use StrictApiKeyMappingSchema when strictApiKeys is true", () => {
      const strictConfig = {
        ragieApiKey: "default-ragie-key",
        strictApiKeys: true,
      };
      const mockMapping = {
        org1: { partition: "partition1", apiKey: "key1" },
        org2: { partition: "partition2", apiKey: "key2" },
      };
      (readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockMapping));

      const mapper = StrictMapper.load(strictConfig, "/path/to/mapping.json");

      expect(mapper).toBeInstanceOf(StrictMapper);
      expect(mapper.hasMapping("org1")).toBe(true);
    });

    it("should throw error when strictApiKeys is true and apiKey is missing", () => {
      const strictConfig = {
        ragieApiKey: "default-ragie-key",
        strictApiKeys: true,
      };
      const mockMapping = {
        org1: { partition: "partition1" }, // Missing apiKey
      };
      (readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockMapping));

      expect(() => StrictMapper.load(strictConfig, "/path/to/mapping.json")).toThrow();
    });

    it("should throw error when file read fails", () => {
      (readFileSync as jest.Mock).mockImplementation(() => {
        throw new Error("File not found");
      });

      expect(() => StrictMapper.load(mockConfig, "/nonexistent.json")).toThrow("Failed to read JSON file");
    });

    it("should throw error when JSON is invalid", () => {
      (readFileSync as jest.Mock).mockReturnValue("invalid json");

      expect(() => StrictMapper.load(mockConfig, "/path/to/mapping.json")).toThrow();
    });
  });
});
