import type { Cache } from '@workspace/platform';
import { RedisCache } from '@workspace/platform';
import type { Session } from '../../domain/Session.js';

/**
 * Redis-backed session cache keyed by the refresh-token hash.
 *
 * Uses the same key shape as {@link MemorySessionCache} so a deployment
 * can swap one for the other without invalidating existing entries.
 */
export class RedisSessionCache {
  constructor(private readonly cache: Cache = new RedisCache()) {}

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