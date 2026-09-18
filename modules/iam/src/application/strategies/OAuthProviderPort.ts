import type { OAuthProfile } from '../../domain/oauth/OAuthProfile.js';
import type { OAuthProvider } from '../../domain/oauth/OAuthProvider.js';

/**
 * Port (interface) that every OAuth provider adapter must implement.
 * Concrete adapters live in infrastructure/oauth/ and are injected by the composition root.
 *
 * Strategy pattern: adding a new provider = adding one new adapter class,
 * zero changes to application or domain code.
 */
export interface OAuthProviderPort {
  readonly provider: OAuthProvider;
  getRedirectUri(): string;

  /**
   * Build the authorization URL to redirect the user to.
   * @param state  CSRF-protection state token (generate in the HTTP controller)
   * @param scopes Additional scopes to request (optional)
   */
  getAuthorizationUrl(state: string, scopes?: string[]): string;

  /**
   * Exchange an authorization code for a normalized OAuthProfile.
   * Called in the OAuth callback handler.
   */
  exchangeCode(code: string, state?: string): Promise<OAuthProfile>;
}
