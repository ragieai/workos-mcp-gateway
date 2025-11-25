import assert from "assert";
import { readFileSync } from "fs";
import { resolve } from "path";
import z from "zod";
import { Config } from "./config";

export interface Mapper {
  hasMapping(organizationId: string): boolean;
  getPartition(organizationId: string): string;
  getApiKey(organizationId: string): string;
}

export interface MapperConfig {
  ragieApiKey: string;
  strictApiKeys: boolean;
}

const MappingSchema = z.record(
  z.string(),
  z.object({
    partition: z.string(),
    apiKey: z.string().optional(),
  })
);

const StrictApiKeyMappingSchema = z.record(
  z.string(),
  z.object({
    partition: z.string(),
    apiKey: z.string(),
  })
);

function readJsonFile<T>(filePath: string): T {
  try {
    const resolvedPath = resolve(filePath);
    const fileContents = readFileSync(resolvedPath, "utf-8");
    return JSON.parse(fileContents);
  } catch (error) {
    throw new Error(`Failed to read JSON file: ${String(error)}`);
  }
}

export class DefaultMapper implements Mapper {
  private config: MapperConfig;
  private mapping: z.infer<typeof MappingSchema>;

  constructor(config: MapperConfig, mapping: z.infer<typeof MappingSchema>) {
    this.config = config;
    this.mapping = mapping;
  }

  hasMapping(_organizationId: string): boolean {
    return true;
  }

  getPartition(organizationId: string): string {
    const entry = this.mapping[organizationId];
    if (entry) {
      return entry.partition;
    } else {
      return organizationId.toLowerCase();
    }
  }

  getApiKey(organizationId: string): string {
    const entry = this.mapping[organizationId];
    if (!entry) {
      return this.config.ragieApiKey;
    }
    if (this.config.strictApiKeys) {
      if (!entry.apiKey) {
        throw new Error(`Organization ${organizationId} has no API key in mapping`);
      }
      return entry.apiKey;
    } else {
      return entry.apiKey ?? this.config.ragieApiKey;
    }
  }

  static load(config: MapperConfig, mappingFile: string): DefaultMapper {
    const json = readJsonFile(mappingFile);
    const mapping = config.strictApiKeys ? StrictApiKeyMappingSchema.parse(json) : MappingSchema.parse(json);
    return new DefaultMapper(config, mapping);
  }
}

export class StrictMapper implements Mapper {
  private config: MapperConfig;
  private mapping: z.infer<typeof MappingSchema>;

  constructor(config: MapperConfig, mapping: z.infer<typeof MappingSchema>) {
    this.config = config;
    this.mapping = mapping;
  }

  hasMapping(organizationId: string): boolean {
    return this.mapping[organizationId] !== undefined;
  }

  getPartition(organizationId: string): string {
    const entry = this.mapping[organizationId];
    if (entry) {
      return entry.partition;
    } else {
      throw new Error(`Organization ${organizationId} not found in mapping`);
    }
  }

  getApiKey(organizationId: string): string {
    const entry = this.mapping[organizationId];
    if (!entry) {
      throw new Error(`Organization ${organizationId} not found in mapping`);
    }
    if (this.config.strictApiKeys) {
      if (!entry.apiKey) {
        throw new Error(`Organization ${organizationId} has no API key in mapping`);
      }
      return entry.apiKey;
    } else {
      return entry.apiKey ?? this.config.ragieApiKey;
    }
  }

  static load(config: MapperConfig, mappingFile: string): StrictMapper {
    const json = readJsonFile(mappingFile);
    const mapping = config.strictApiKeys ? StrictApiKeyMappingSchema.parse(json) : MappingSchema.parse(json);
    return new StrictMapper(config, mapping);
  }
}

export function loadMapper(config: Config): Mapper {
  try {
    if (config.strictMapping) {
      assert(config.mappingFile, "mappingFile is required when strictMapping is true");
      return StrictMapper.load(config, config.mappingFile);
    } else if (config.mappingFile) {
      return DefaultMapper.load(config, config.mappingFile);
    } else {
      return new DefaultMapper(config, {});
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues.map(e => `${e.path.join(".")}: ${e.message}`).join(", ");
      throw new Error(`Mapping file validation failed: ${errorMessages}`);
    } else {
      throw error;
    }
  }
}
