import type { Lock } from './Lock.js';
export interface LockManager {
  acquire(key: string, ttlMs?: number): Promise<Lock | null>;
  release(lock: Lock): Promise<void>;
  extend(lock: Lock, ttlMs: number): Promise<boolean>;
  withLock<T>(key: string, fn: () => Promise<T>, ttlMs?: number): Promise<T>;
}
