import type { OAuthProvider } from '../../domain/oauth/OAuthProvider.js';
import type { OAuthProviderPort } from './OAuthProviderPort.js';

/**
 * Registry that maps each OAuthProvider enum value to its concrete adapter.
 * Populated at composition-root time (apps/api bootstrap).
 */
export class OAuthProviderRegistry {
  private readonly providers = new Map<OAuthProvider, OAuthProviderPort>();

  register(adapter: OAuthProviderPort): void {
    this.providers.set(adapter.provider, adapter);
  }

  get(provider: OAuthProvider): OAuthProviderPort {
    const adapter = this.providers.get(provider);
    if (!adapter) {
      throw new Error(`OAuth provider not registered: ${provider}`);
    }
    return adapter;
  }

  has(provider: OAuthProvider): boolean {
    return this.providers.has(provider);
  }

  registeredProviders(): OAuthProvider[] {
    return [...this.providers.keys()];
  }
}
