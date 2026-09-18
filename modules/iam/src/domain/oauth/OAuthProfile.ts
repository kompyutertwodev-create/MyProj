import type { OAuthProvider } from './OAuthProvider.js';

/**
 * Normalized profile returned by any OAuth provider after successful authentication.
 * Concrete providers map their raw API response into this shape.
 */
export interface OAuthProfile {
  /** Stable unique ID from the provider (e.g. Google sub, GitHub id). */
  readonly providerUserId: string;
  readonly provider: OAuthProvider;
  readonly email: string | null;
  readonly emailVerified: boolean;
  readonly displayName: string;
  readonly avatarUrl: string | null;
  /** Raw provider-specific extras preserved for audit / matching. */
  readonly raw: Record<string, unknown>;
}
