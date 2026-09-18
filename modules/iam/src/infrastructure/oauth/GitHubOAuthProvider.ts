import type { OAuthProviderPort } from '../../application/strategies/OAuthProviderPort.js';
import type { OAuthProfile } from '../../domain/oauth/OAuthProfile.js';
import { OAuthProvider } from '../../domain/oauth/OAuthProvider.js';
import { OAuthProviderError } from '../../application/ports/OAuthErrors.js';
import { validateRedirectUri } from './validateRedirectUri.js';

interface GitHubTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
}

interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  avatar_url: string | null;
  email: string | null;
}

interface GitHubEmail {
  email: string;
  primary: boolean;
  verified: boolean;
}

export class GitHubOAuthProvider implements OAuthProviderPort {
  readonly provider = OAuthProvider.GitHub;

  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;

  constructor(config: { clientId: string; clientSecret: string; redirectUri: string }) {
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.redirectUri = validateRedirectUri('GitHub', config.redirectUri);
  }

  getRedirectUri(): string {
    return this.redirectUri;
  }

  getAuthorizationUrl(state: string, scopes?: string[]): string {
    const defaultScopes = ['user:email', 'read:user'];
    const scope = [...defaultScopes, ...(scopes ?? [])].join(',');

    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope,
      state,
    });

    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  async exchangeCode(code: string): Promise<OAuthProfile> {
    // 1. Exchange code for access token
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        redirect_uri: this.redirectUri,
      }),
    });

    if (!tokenRes.ok) {
      throw new OAuthProviderError('GitHub', 'token exchange');
    }

    const tokens = (await tokenRes.json()) as GitHubTokenResponse;
    if (!tokens.access_token) {
      throw new OAuthProviderError('GitHub', 'token response validation');
    }

    // 2. Fetch user profile
    const headers = {
      Authorization: `Bearer ${tokens.access_token}`,
      Accept: 'application/vnd.github+json',
    };

    const [userRes, emailsRes] = await Promise.all([
      fetch('https://api.github.com/user', { headers }),
      fetch('https://api.github.com/user/emails', { headers }),
    ]);

    if (!userRes.ok) {
      throw new OAuthProviderError('GitHub', 'user profile lookup');
    }
    const user = (await userRes.json()) as GitHubUser;
    const emails = emailsRes.ok ? ((await emailsRes.json()) as GitHubEmail[]) : [];

    // Prefer verified primary email
    const primaryEmail =
      emails.find((e) => e.primary && e.verified)?.email ??
      emails.find((e) => e.primary)?.email ??
      user.email;

    return {
      provider: OAuthProvider.GitHub,
      providerUserId: String(user.id),
      email: primaryEmail ?? null,
      emailVerified: emails.find((e) => e.email === primaryEmail)?.verified ?? false,
      displayName: user.name ?? user.login,
      avatarUrl: user.avatar_url,
      raw: user as unknown as Record<string, unknown>,
    };
  }
}
