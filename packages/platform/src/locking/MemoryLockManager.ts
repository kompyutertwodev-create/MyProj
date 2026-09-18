import { randomUUID } from 'node:crypto';
import type { Lock } from './Lock.js';
import type { LockManager } from './LockManager.js';

interface Entry {
  token: string;
  expiresAt: number;
}
export class MemoryLockManager implements LockManager {
  private readonly locks = new Map<string, Entry>();
  async acquire(key: string, ttlMs = 30_000): Promise<Lock | null> {
    const current = this.locks.get(key);
    if (current && current.expiresAt > Date.now()) return null;
    const token = randomUUID();
    this.locks.set(key, { token, expiresAt: Date.now() + ttlMs });
    return this.lock(key, token);
  }
  async release(lock: Lock): Promise<void> {
    if (this.locks.get(lock.key)?.token === lock.token) this.locks.delete(lock.key);
  }
  async extend(lock: Lock, ttlMs: number): Promise<boolean> {
    const item = this.locks.get(lock.key);
    if (!item || item.token !== lock.token || item.expiresAt <= Date.now()) return false;
    item.expiresAt = Date.now() + ttlMs;
    return true;
  }
  async withLock<T>(key: string, fn: () => Promise<T>, ttlMs = 30_000): Promise<T> {
    const lock = await this.acquire(key, ttlMs);
    if (!lock) throw new Error(`Unable to acquire lock: ${key}`);
    try {
      return await fn();
    } finally {
      await lock.release();
    }
  }
  private lock(key: string, token: string): Lock {
    return {
      key,
      token,
      acquiredAt: new Date(),
      release: () =>
        this.release({ key, token, acquiredAt: new Date(), release: async () => undefined }),
    };
  }
}
