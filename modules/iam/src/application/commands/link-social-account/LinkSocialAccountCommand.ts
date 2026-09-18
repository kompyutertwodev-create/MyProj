import type { OAuthProvider } from '../../../domain/oauth/OAuthProvider.js';

export interface LinkSocialAccountCommand {
  readonly userId: string;
  readonly provider: OAuthProvider;
  readonly code: string;
  readonly state?: string;
}
