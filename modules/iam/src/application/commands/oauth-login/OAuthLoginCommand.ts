import type { OAuthProvider } from '../../../domain/oauth/OAuthProvider.js';

/**
 * Triggered by the OAuth callback controller after receiving the authorization code.
 * The handler resolves or creates a local User linked to the provider identity.
 */
export interface OAuthLoginCommand {
  readonly provider: OAuthProvider;
  readonly code: string;
  readonly state?: string;
  readonly deviceInfo?: {
    deviceId?: string;
    deviceName?: string;
    deviceType?: string;
    ipAddress?: string;
    userAgent?: string;
  };
}
