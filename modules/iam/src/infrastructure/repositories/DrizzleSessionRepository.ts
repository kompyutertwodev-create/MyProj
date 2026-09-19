import { and, eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { SessionRepository } from '../../domain/repositories/SessionRepository.js';
import { Session } from '../../domain/Session.js';
import { SessionId } from '../../domain/SessionId.js';
import { sessions } from '../database/schema/sessions.table.js';

/**
 * Drizzle-backed SessionRepository.
 *
 * Persists only the SHA-256 hash of the refresh token вЂ” the plaintext
 * never leaves the application layer. Lookups by token therefore hash the
 * input first (see `findByRefreshTokenHash`).
 */
export class DrizzleSessionRepository implements SessionRepository {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(private readonly db: NodePgDatabase<any>) {}

  async findById(id: string): Promise<Session | null> {
    const rows = await this.db
      .select()
      .from(sessions)
      .where(eq(sessions.id, id))
      .limit(1);
    return rows[0] ? this.toDomain(rows[0]) : null;
  }

  async findByUserId(userId: string): Promise<Session[]> {
    const rows = await this.db
      .select()
      .from(sessions)
      .where(eq(sessions.identityId, userId));
    return rows.map((r) => this.toDomain(r));
  }

  async findByRefreshTokenHash(hash: string): Promise<Session | null> {
    const rows = await this.db
      .select()
      .from(sessions)
      .where(eq(sessions.refreshTokenHash, hash))
      .limit(1);
    return rows[0] ? this.toDomain(rows[0]) : null;
  }

  async save(session: Session): Promise<void> {
    await this.db
      .insert(sessions)
      .values({
        id: session.id.value,
        identityId: session.userId,
        deviceId: session.deviceId,
        deviceName: session.deviceName,
        deviceType: session.deviceType,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
        refreshTokenHash: session.refreshTokenHash,
        expiresAt: session.expiresAt,
        lastActiveAt: session.lastActiveAt,
        createdAt: session.createdAt,
      })
      .onConflictDoUpdate({
        target: sessions.id,
        set: {
          refreshTokenHash: session.refreshTokenHash,
          expiresAt: session.expiresAt,
          lastActiveAt: session.lastActiveAt,
        },
      });
  }

  async rotate(
    id: string,
    currentRefreshTokenHash: string,
    nextRefreshTokenHash: string,
    expiresAt: Date,
  ): Promise<boolean> {
    const updated = await this.db
      .update(sessions)
      .set({
        refreshTokenHash: nextRefreshTokenHash,
        expiresAt,
        lastActiveAt: new Date(),
      })
      .where(
        and(
          eq(sessions.id, id),
          eq(sessions.refreshTokenHash, currentRefreshTokenHash),
        ),
      )
      .returning({ id: sessions.id });
    return updated.length > 0;
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(sessions).where(eq(sessions.id, id));
  }

  async deleteAllForUser(userId: string): Promise<void> {
    await this.db.delete(sessions).where(eq(sessions.identityId, userId));
  }

  private toDomain(row: typeof sessions.$inferSelect): Session {
    return Session.create(new SessionId(row.id), {
      userId: row.identityId,
      deviceId: row.deviceId,
      deviceName: row.deviceName,
      deviceType: row.deviceType,
      ipAddress: row.ipAddress,
      userAgent: row.userAgent,
      refreshTokenHash: row.refreshTokenHash,
      expiresAt: row.expiresAt,
      lastActiveAt: row.lastActiveAt,
      createdAt: row.createdAt,
    });
  }
}