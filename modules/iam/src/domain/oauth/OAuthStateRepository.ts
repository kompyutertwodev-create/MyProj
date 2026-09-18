import type { OAuthProvider } from './OAuthProvider.js';

export interface OAuthStateRepository {
  save(state: string, provider: OAuthProvider, expiresAt: Date): Promise<void>;
  consume(state: string, provider: OAuthProvider, now?: Date): Promise<boolean>;
}
