import type { ConfigLoader } from './ConfigLoader.js';

export class EnvConfigLoader implements ConfigLoader {
  async load(): Promise<Record<string, unknown>> {
    const config: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(process.env)) {
      if (value !== undefined) {
        config[key] = value;
      }
    }
    return config;
  }
}

export class MapConfig {
  private readonly data: Record<string, unknown>;

  constructor(data: Record<string, unknown>) {
    this.data = data;
  }

  get<T>(key: string): T {
    if (!(key in this.data)) {
      throw new Error(`Config key "${key}" not found`);
    }
    return this.data[key] as T;
  }

  getOrDefault<T>(key: string, defaultValue: T): T {
    if (!(key in this.data)) return defaultValue;
    return this.data[key] as T;
  }
}
