import { Redis } from 'ioredis';
import { serialize, deserialize } from './utils/CacheSerialization.js';
import type { Cache } from './Cache.js';
import type { CacheOptions } from './CacheOptions.js';
import type { CacheStats } from './CacheStats.js';

export class RedisCache implements Cache {
  private readonly client: Redis;
  private readonly defaultTtlSeconds: number;
  private hits = 0;
  private misses = 0;

  constructor(client?: Redis, defaultTtlSeconds = 3600) {
    this.client = client ?? new Redis(process.env['REDIS_URL'] ?? 'redis://localhost:6379');
    this.defaultTtlSeconds = defaultTtlSeconds;
  }

  async get<T>(key: string): Promise<T | null> {
    const raw = await this.client.get(key);
    if (raw === null) {
      this.misses++;
      return null;
    }
    this.hits++;
    return deserialize<T>(raw);
  }

  async set<T>(key: string, value: T, opts?: CacheOptions): Promise<void> {
    const prefix = opts?.prefix ? `${opts.prefix}:` : '';
    const fullKey = prefix + key;
    const ttl = opts?.ttlSeconds ?? this.defaultTtlSeconds;
    const serialized = serialize(value);
    if (ttl > 0) {
      await this.client.setex(fullKey, ttl, serialized);
    } else {
      await this.client.set(fullKey, serialized);
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async has(key: string): Promise<boolean> {
    const exists = await this.client.exists(key);
    return exists === 1;
  }

  async flush(): Promise<void> {
    await this.client.flushdb();
    this.hits = 0;
    this.misses = 0;
  }

  getStats(): CacheStats {
    return { hits: this.hits, misses: this.misses, size: 0 };
  }
}
