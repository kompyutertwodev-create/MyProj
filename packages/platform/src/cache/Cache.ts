import type { CacheOptions } from './CacheOptions.js';
import type { CacheStats } from './CacheStats.js';

export interface Cache {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, opts?: CacheOptions): Promise<void>;
  del(key: string): Promise<void>;
  has(key: string): Promise<boolean>;
  flush(): Promise<void>;
  getStats(): CacheStats;
}
