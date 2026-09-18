import type { OAuthProvider } from '../../domain/oauth/OAuthProvider.js';
import type { OAuthStateRepository } from '../../domain/oauth/OAuthStateRepository.js';

interface OAuthStateRecord {
  provider: OAuthProvider;
  expiresAt: Date;
}

export class InMemoryOAuthStateRepository implements OAuthStateRepository {
  private readonly states = new Map<string, OAuthStateRecord>();

  async save(state: string, provider: OAuthProvider, expiresAt: Date): Promise<void> {
    this.states.set(state, { provider, expiresAt });
  }

  async consume(state: string, provider: OAuthProvider, now = new Date()): Promise<boolean> {
    const record = this.states.get(state);
    if (!record || record.provider !== provider || record.expiresAt <= now) {
      return false;
    }
    this.states.delete(state);
    return true;
  }
}
