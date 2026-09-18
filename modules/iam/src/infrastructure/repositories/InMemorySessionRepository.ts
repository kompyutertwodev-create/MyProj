import type { SessionRepository } from '../../domain/repositories/SessionRepository.js';
import type { Session } from '../../domain/Session.js';

export class InMemorySessionRepository implements SessionRepository {
  private readonly sessions = new Map<string, Session>();

  async findById(id: string): Promise<Session | null> {
    return this.sessions.get(id) ?? null;
  }

  async findByUserId(userId: string): Promise<Session[]> {
    return [...this.sessions.values()].filter((s) => s.userId === userId);
  }

  async findByRefreshToken(token: string): Promise<Session | null> {
    return [...this.sessions.values()].find((s) => s.refreshToken === token) ?? null;
  }

  async save(session: Session): Promise<void> {
    this.sessions.set(session.id.value, session);
  }

  async rotate(
    id: string,
    currentRefreshToken: string,
    nextRefreshToken: string,
    expiresAt: Date
  ): Promise<boolean> {
    const session = this.sessions.get(id);
    if (!session || session.refreshToken !== currentRefreshToken || session.isExpired()) {
      return false;
    }
    session.refresh(nextRefreshToken, expiresAt);
    return true;
  }

  async delete(id: string): Promise<void> {
    this.sessions.delete(id);
  }

  async deleteAllForUser(userId: string): Promise<void> {
    for (const [id, session] of this.sessions) {
      if (session.userId === userId) this.sessions.delete(id);
    }
  }
}
