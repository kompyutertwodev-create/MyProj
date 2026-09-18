import type { Session } from '../Session.js';

export interface SessionRepository {
  findById(id: string): Promise<Session | null>;
  findByUserId(userId: string): Promise<Session[]>;
  findByRefreshToken(token: string): Promise<Session | null>;
  save(session: Session): Promise<void>;
  rotate(
    id: string,
    currentRefreshToken: string,
    nextRefreshToken: string,
    expiresAt: Date
  ): Promise<boolean>;
  delete(id: string): Promise<void>;
  deleteAllForUser(userId: string): Promise<void>;
}
