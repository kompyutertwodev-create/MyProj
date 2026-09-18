/**
 * Supported OAuth / social-login providers.
 * Add new providers here without touching any other domain object.
 */
export enum OAuthProvider {
  Google = 'google',
  GitHub = 'github',
  Telegram = 'telegram',
  Apple = 'apple',
  Facebook = 'facebook',
}

/** Human-readable label for each provider. */
export const OAuthProviderLabel: Record<OAuthProvider, string> = {
  [OAuthProvider.Google]: 'Google',
  [OAuthProvider.GitHub]: 'GitHub',
  [OAuthProvider.Telegram]: 'Telegram',
  [OAuthProvider.Apple]: 'Apple',
  [OAuthProvider.Facebook]: 'Facebook',
};
