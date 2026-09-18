import { eq, and } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { SocialIdentityRepository } from '../../domain/oauth/SocialIdentityRepository.js';
import { SocialIdentity } from '../../domain/oauth/SocialIdentity.js';
import type { OAuthProvider } from '../../domain/oauth/OAuthProvider.js';
import { socialIdentities } from '../database/schema/social_identities.table.js';

export class DrizzleSocialIdentityRepository implements SocialIdentityRepository {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(private readonly db: NodePgDatabase<any>) {}

  async findByProvider(
    provider: OAuthProvider,
    providerUserId: string
  ): Promise<SocialIdentity | null> {
    const rows = await this.db
      .select()
      .from(socialIdentities)
      .where(
        and(
          eq(socialIdentities.provider, provider),
          eq(socialIdentities.providerUserId, providerUserId)
        )
      )
      .limit(1);

    return rows[0] ? this.toDomain(rows[0]) : null;
  }

  async findAllByUserId(userId: string): Promise<SocialIdentity[]> {
    const rows = await this.db
      .select()
      .from(socialIdentities)
      .where(eq(socialIdentities.userId, userId));
    return rows.map((r) => this.toDomain(r));
  }

  async save(identity: SocialIdentity): Promise<void> {
    const row = identity.toPersistence();
    await this.db
      .insert(socialIdentities)
      .values({
        id: row.id,
        userId: row.userId,
        provider: row.provider,
        providerUserId: row.providerUserId,
        providerEmail: row.providerEmail,
        providerDisplayName: row.providerDisplayName,
        accessToken: row.accessToken,
        refreshToken: row.refreshToken,
        tokenExpiresAt: row.tokenExpiresAt,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      })
      .onConflictDoUpdate({
        target: socialIdentities.id,
        set: {
          providerEmail: row.providerEmail,
          providerDisplayName: row.providerDisplayName,
          accessToken: row.accessToken,
          refreshToken: row.refreshToken,
          tokenExpiresAt: row.tokenExpiresAt,
          updatedAt: row.updatedAt,
        },
      });
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(socialIdentities).where(eq(socialIdentities.id, id));
  }

  async deleteAllByUserId(userId: string): Promise<void> {
    await this.db.delete(socialIdentities).where(eq(socialIdentities.userId, userId));
  }

  private toDomain(row: typeof socialIdentities.$inferSelect): SocialIdentity {
    return SocialIdentity.reconstitute({
      id: row.id,
      userId: row.userId,
      provider: row.provider as OAuthProvider,
      providerUserId: row.providerUserId,
      providerEmail: row.providerEmail ?? null,
      providerDisplayName: row.providerDisplayName,
      accessToken: row.accessToken ?? null,
      refreshToken: row.refreshToken ?? null,
      tokenExpiresAt: row.tokenExpiresAt ?? null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
