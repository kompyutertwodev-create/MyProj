import { and, eq, gt } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { OAuthStateRepository } from '../../domain/oauth/OAuthStateRepository.js';
import type { OAuthProvider } from '../../domain/oauth/OAuthProvider.js';
import { oauthStates } from '../database/schema/oauth_states.table.js';

export class DrizzleOAuthStateRepository implements OAuthStateRepository {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(private readonly db: NodePgDatabase<any>) {}

  async save(state: string, provider: OAuthProvider, expiresAt: Date): Promise<void> {
    await this.db.insert(oauthStates).values({ state, provider, expiresAt });
  }

  async consume(state: string, provider: OAuthProvider, now = new Date()): Promise<boolean> {
    const consumed = await this.db
      .delete(oauthStates)
      .where(
        and(
          eq(oauthStates.state, state),
          eq(oauthStates.provider, provider),
          gt(oauthStates.expiresAt, now)
        )
      )
      .returning({ state: oauthStates.state });
    return consumed.length > 0;
  }
}
