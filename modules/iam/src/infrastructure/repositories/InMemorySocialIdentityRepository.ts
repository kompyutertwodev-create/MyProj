import type { SocialIdentityRepository } from '../../domain/oauth/SocialIdentityRepository.js';
import { SocialIdentity } from '../../domain/oauth/SocialIdentity.js';
import type { OAuthProvider } from '../../domain/oauth/OAuthProvider.js';

export class InMemorySocialIdentityRepository implements SocialIdentityRepository {
  private readonly store = new Map<string, SocialIdentity>();

  async findByProvider(
    provider: OAuthProvider,
    providerUserId: string
  ): Promise<SocialIdentity | null> {
    for (const identity of this.store.values()) {
      if (identity.provider === provider && identity.providerUserId === providerUserId) {
        return identity;
      }
    }
    return null;
  }

  async findAllByUserId(userId: string): Promise<SocialIdentity[]> {
    return [...this.store.values()].filter((i) => i.userId === userId);
  }

  async save(identity: SocialIdentity): Promise<void> {
    this.store.set(identity.id, identity);
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id);
  }

  async deleteAllByUserId(userId: string): Promise<void> {
    for (const [key, val] of this.store.entries()) {
      if (val.userId === userId) this.store.delete(key);
    }
  }
}
