import type { Cache } from '@workspace/platform';
import { MemoryCache } from '@workspace/platform';
import type { Session } from '../../domain/Session.js';

export class MemorySessionCache {
  constructor(private readonly cache: Cache = new MemoryCache(300)) {}

  async get(refreshToken: string): Promise<Session | null> {
    return this.cache.get<Session>(`iam:session:${refreshToken}`);
  }

  async set(session: Session, ttlSeconds = 300): Promise<void> {
    await this.cache.set(`iam:session:${session.refreshToken}`, session, { ttlSeconds });
  }

  async delete(refreshToken: string): Promise<void> {
    await this.cache.del(`iam:session:${refreshToken}`);
  }
}
