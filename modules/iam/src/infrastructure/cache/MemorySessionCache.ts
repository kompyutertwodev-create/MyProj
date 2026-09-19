import type { Cache } from '@workspace/platform';
import { MemoryCache } from '@workspace/platform';
import type { Session } from '../../domain/Session.js';

/**
 * In-process session cache keyed by the refresh-token hash.
 *
 * The plaintext token is never stored; callers hash the input before
 * calling `get`/`delete`. This keeps the cache index consistent with the
 * database (which also stores only the hash).
 */
export class MemorySessionCache {
  constructor(private readonly cache: Cache = new MemoryCache(300)) {}

  async get(refreshTokenHash: string): Promise<Session | null> {
    return this.cache.get<Session>(`iam:session:${refreshTokenHash}`);
  }

  async set(session: Session, ttlSeconds = 300): Promise<void> {
    await this.cache.set(
      `iam:session:${session.refreshTokenHash}`,
      session,
      { ttlSeconds },
    );
  }

  async delete(refreshTokenHash: string): Promise<void> {
    await this.cache.del(`iam:session:${refreshTokenHash}`);
  }
}