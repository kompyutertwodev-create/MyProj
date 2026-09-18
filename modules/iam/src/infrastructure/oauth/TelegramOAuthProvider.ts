import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import type { OAuthProviderPort } from '../../application/strategies/OAuthProviderPort.js';
import type { OAuthProfile } from '../../domain/oauth/OAuthProfile.js';
import { OAuthProvider } from '../../domain/oauth/OAuthProvider.js';
import { OAuthAuthenticationError } from '../../application/ports/OAuthErrors.js';

/**
 * Telegram Login Widget authentication.
 *
 * Telegram does NOT use standard OAuth2. Instead:
 *   1. The frontend embeds the Telegram Login Widget (<script> tag).
 *   2. After the user clicks "Login with Telegram", Telegram POSTs the
 *      user data hash to your callback URL (or calls a JS callback).
 *   3. The backend verifies the HMAC-SHA256 signature using the bot token.
 *
 * getAuthorizationUrl() returns a JS widget embed URL (for reference/deep-linking).
 * exchangeCode() here validates the Telegram data payload (sent as JSON body).
 *
 * Usage: frontend sends the raw Telegram auth data object as the "code" field
 * (JSON-stringified). This handler verifies + normalizes it.
 */
export interface TelegramAuthData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

export class TelegramOAuthProvider implements OAuthProviderPort {
  readonly provider = OAuthProvider.Telegram;

  private readonly botToken: string;
  private readonly botUsername: string;

  constructor(config: { botToken: string; botUsername: string }) {
    this.botToken = config.botToken;
    this.botUsername = config.botUsername;
  }

  getAuthorizationUrl(_state: string): string {
    // Telegram widget is embedded on the frontend; deep-link for reference
    return `https://t.me/${this.botUsername}?start=login`;
  }

  getRedirectUri(): string {
    return `https://t.me/${this.botUsername}`;
  }

  async exchangeCode(code: string): Promise<OAuthProfile> {
    let data: TelegramAuthData;
    try {
      data = JSON.parse(code) as TelegramAuthData;
    } catch {
      throw new OAuthAuthenticationError('Invalid Telegram auth data');
    }

    this.verifyTelegramHash(data);

    // Check auth_date is not older than 24 hours
    const ageSeconds = Math.floor(Date.now() / 1000) - data.auth_date;
    if (ageSeconds > 86400) {
      throw new OAuthAuthenticationError('Telegram auth data is expired');
    }
    if (ageSeconds < -60) {
      throw new OAuthAuthenticationError('Telegram auth data timestamp is invalid');
    }

    const displayName = [data.first_name, data.last_name].filter(Boolean).join(' ');

    return {
      provider: OAuthProvider.Telegram,
      providerUserId: String(data.id),
      email: null, // Telegram never exposes email
      emailVerified: false,
      displayName: displayName || data.username || String(data.id),
      avatarUrl: data.photo_url ?? null,
      raw: data as unknown as Record<string, unknown>,
    };
  }

  private verifyTelegramHash(data: TelegramAuthData): void {
    const { hash, ...rest } = data;

    // Build the data-check string: sorted key=value pairs joined by \n
    const checkString = Object.entries(rest)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${String(v)}`)
      .join('\n');

    // Secret key = SHA-256(bot_token), NOT the token itself
    const secretKey = createHash('sha256').update(this.botToken).digest();

    const expectedHash = createHmac('sha256', secretKey).update(checkString).digest('hex');

    const expected = Buffer.from(expectedHash, 'hex');
    const actual = Buffer.from(hash, 'hex');
    if (actual.length !== expected.length || !timingSafeEqual(expected, actual)) {
      throw new OAuthAuthenticationError('Telegram auth data hash verification failed');
    }
  }
}
