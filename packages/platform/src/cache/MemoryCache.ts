import type { Cache } from './Cache.js';
import type { CacheOptions } from './CacheOptions.js';
import type { CacheStats } from './CacheStats.js';

interface Entry {
  value: unknown;
  expiresAt: number | null;
}

export class MemoryCache implements Cache {
  private readonly store = new Map<string, Entry>();
  private hits = 0;
  private misses = 0;
  private readonly defaultTtlSeconds: number;

  constructor(defaultTtlSeconds = 3600) {
    this.defaultTtlSeconds = defaultTtlSeconds;
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) {
      this.misses++;
      return null;
    }
    if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      this.misses++;
      return null;
    }
    this.hits++;
    return entry.value as T;
  }

  async set<T>(key: string, value: T, opts?: CacheOptions): Promise<void> {
    const ttl = opts?.ttlSeconds ?? this.defaultTtlSeconds;
    const expiresAt = ttl > 0 ? Date.now() + ttl * 1000 : null;
    this.store.set(key, { value, expiresAt });
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  async has(key: string): Promise<boolean> {
    const entry = this.store.get(key);
    if (!entry) return false;
    if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return false;
    }
    return true;
  }

  async flush(): Promise<void> {
    this.store.clear();
    this.hits = 0;
    this.misses = 0;
  }

  getStats(): CacheStats {
    return { hits: this.hits, misses: this.misses, size: this.store.size };
  }
}
