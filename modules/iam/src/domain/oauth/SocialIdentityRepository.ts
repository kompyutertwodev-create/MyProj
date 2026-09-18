import type { OAuthProvider } from './OAuthProvider.js';
import type { SocialIdentity } from './SocialIdentity.js';

/**
 * Port for SocialIdentity persistence.
 * Implemented in infrastructure/repositories/DrizzleSocialIdentityRepository.ts
 */
export interface SocialIdentityRepository {
  findByProvider(provider: OAuthProvider, providerUserId: string): Promise<SocialIdentity | null>;

  findAllByUserId(userId: string): Promise<SocialIdentity[]>;

  save(identity: SocialIdentity): Promise<void>;

  delete(id: string): Promise<void>;

  deleteAllByUserId(userId: string): Promise<void>;
}
