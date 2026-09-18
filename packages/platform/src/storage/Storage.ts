import type { File } from './File.js';
import type { StorageOptions } from './StorageOptions.js';
export interface Storage {
  put(key: string, body: Uint8Array | string, options?: StorageOptions): Promise<void>;
  get(key: string): Promise<File | null>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  list(prefix?: string): Promise<string[]>;
  getUrl?(key: string, expiresInSeconds?: number): Promise<string>;
}
