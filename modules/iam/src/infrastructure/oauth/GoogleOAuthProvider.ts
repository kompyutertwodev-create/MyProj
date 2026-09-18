import type { OAuthProviderPort } from '../../application/strategies/OAuthProviderPort.js';
import type { OAuthProfile } from '../../domain/oauth/OAuthProfile.js';
import { OAuthProvider } from '../../domain/oauth/OAuthProvider.js';
import {
  OAuthProviderError,
  OAuthAuthenticationError,
} from '../../application/ports/OAuthErrors.js';
import { validateRedirectUri } from './validateRedirectUri.js';

interface GoogleTokenResponse {
  access_token: string;
  id_token: string;
  expires_in: number;
  token_type: string;
  refresh_token?: string;
}

interface GoogleUserInfo {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name: string;
  picture?: string;
}

export class GoogleOAuthProvider implements OAuthProviderPort {
  readonly provider = OAuthProvider.Google;

  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;

  constructor(config: { clientId: string; clientSecret: string; redirectUri: string }) {
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.redirectUri = validateRedirectUri('Google', config.redirectUri);
  }

  getRedirectUri(): string {
    return this.redirectUri;
  }

  getAuthorizationUrl(state: string, scopes?: string[]): string {
    const defaultScopes = ['openid', 'email', 'profile'];
    const scope = [...defaultScopes, ...(scopes ?? [])].join(' ');

    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope,
      state,
      access_type: 'offline',
      prompt: 'select_account',
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async exchangeCode(code: string): Promise<OAuthProfile> {
    // 1. Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: this.redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      throw new OAuthProviderError('Google', 'token exchange');
    }

    const tokens = (await tokenRes.json()) as GoogleTokenResponse;

    // 2. Fetch user info
    const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userRes.ok) {
      throw new OAuthProviderError('Google', 'user profile lookup');
    }

    const userInfo = (await userRes.json()) as GoogleUserInfo;
    if (!userInfo.sub) {
      throw new OAuthProviderError('Google', 'user profile validation');
    }
    if (userInfo.email && userInfo.email_verified === false) {
      throw new OAuthAuthenticationError('Google account email is not verified');
    }

    return {
      provider: OAuthProvider.Google,
      providerUserId: userInfo.sub,
      email: userInfo.email ?? null,
      emailVerified: userInfo.email_verified ?? false,
      displayName: userInfo.name,
      avatarUrl: userInfo.picture ?? null,
      raw: userInfo as unknown as Record<string, unknown>,
    };
  }
}
