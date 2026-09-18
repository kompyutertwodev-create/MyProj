import type Redis from 'ioredis';
import type { Lock } from './Lock.js';
import type { LockManager } from './LockManager.js';
import { randomUUID } from 'node:crypto';
export class RedisLockManager implements LockManager {
  constructor(
    private readonly client: Redis,
    private readonly prefix = 'lock'
  ) {}
  async acquire(key: string, ttlMs = 30_000): Promise<Lock | null> {
    const token = randomUUID(),
      name = `${this.prefix}:${key}`;
    const result = await this.client.set(name, token, 'PX', ttlMs, 'NX');
    if (result !== 'OK') return null;
    const lock: Lock = {
      key,
      token,
      acquiredAt: new Date(),
      release: async () => this.release(lock),
    };
    return lock;
  }
  async release(lock: Lock): Promise<void> {
    const script =
      "if redis.call('get',KEYS[1])==ARGV[1] then return redis.call('del',KEYS[1]) else return 0 end";
    await this.client.eval(script, 1, `${this.prefix}:${lock.key}`, lock.token);
  }
  async extend(lock: Lock, ttlMs: number): Promise<boolean> {
    const script =
      "if redis.call('get',KEYS[1])==ARGV[1] then return redis.call('pexpire',KEYS[1],ARGV[2]) else return 0 end";
    return (
      Number(await this.client.eval(script, 1, `${this.prefix}:${lock.key}`, lock.token, ttlMs)) ===
      1
    );
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
}
