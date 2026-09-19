import type { Session } from '../Session.js';

/**
 * Repository contract for the Session aggregate.
 *
 * Tokens are addressed by their SHA-256 hash: the domain never sees the
 * plaintext, and the caller is responsible for hashing the incoming token
 * before calling `findByRefreshTokenHash` / `rotate`.
 */
export interface SessionRepository {
  findById(id: string): Promise<Session | null>;
  findByUserId(userId: string): Promise<Session[]>;

  /** Look up a session by the hash of its current refresh token. */
  findByRefreshTokenHash(hash: string): Promise<Session | null>;

  save(session: Session): Promise<void>;

  /**
   * Atomically replace the current refresh token hash with a new one,
   * provided the stored hash still matches. Returns false if the row was
   * concurrently rotated, so the caller can treat it as a replay attempt.
   */
  rotate(
    id: string,
    currentRefreshTokenHash: string,
    nextRefreshTokenHash: string,
    expiresAt: Date,
  ): Promise<boolean>;

  delete(id: string): Promise<void>;
  deleteAllForUser(userId: string): Promise<void>;
}