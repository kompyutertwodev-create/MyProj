import { randomUUID } from 'node:crypto';
import type { OAuthProvider } from './OAuthProvider.js';

/**
 * SocialIdentity — links an external OAuth provider account to a local User.
 * One User may have many SocialIdentities (one per provider).
 * This is NOT an AggregateRoot — it is persisted and loaded together with the
 * User aggregate via the UserRepository (or its own SocialIdentityRepository
 * for cross-cutting lookups).
 */
export interface SocialIdentityProps {
  id: string;
  userId: string;
  provider: OAuthProvider;
  /** Stable unique ID from the provider (never changes, unlike email). */
  providerUserId: string;
  /** Last known email from the provider — may change between logins. */
  providerEmail: string | null;
  /** Last known display name from provider. */
  providerDisplayName: string;
  /** OAuth access token (optional — stored only when needed for API calls). */
  accessToken: string | null;
  /** OAuth refresh token (optional). */
  refreshToken: string | null;
  /** When the access token expires. */
  tokenExpiresAt: Date | null;
  readonly createdAt: Date;
  updatedAt: Date;
}

export class SocialIdentity {
  private constructor(private readonly props: SocialIdentityProps) {}

  static create(
    userId: string,
    provider: OAuthProvider,
    providerUserId: string,
    providerEmail: string | null,
    providerDisplayName: string
  ): SocialIdentity {
    const now = new Date();
    return new SocialIdentity({
      id: randomUUID(),
      userId,
      provider,
      providerUserId,
      providerEmail,
      providerDisplayName,
      accessToken: null,
      refreshToken: null,
      tokenExpiresAt: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: SocialIdentityProps): SocialIdentity {
    return new SocialIdentity(props);
  }

  get id(): string {
    return this.props.id;
  }
  get userId(): string {
    return this.props.userId;
  }
  get provider(): OAuthProvider {
    return this.props.provider;
  }
  get providerUserId(): string {
    return this.props.providerUserId;
  }
  get providerEmail(): string | null {
    return this.props.providerEmail;
  }
  get providerDisplayName(): string {
    return this.props.providerDisplayName;
  }
  get accessToken(): string | null {
    return this.props.accessToken;
  }
  get refreshToken(): string | null {
    return this.props.refreshToken;
  }
  get tokenExpiresAt(): Date | null {
    return this.props.tokenExpiresAt;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  updateTokens(accessToken: string, refreshToken: string | null, expiresAt: Date | null): void {
    this.props.accessToken = accessToken;
    this.props.refreshToken = refreshToken;
    this.props.tokenExpiresAt = expiresAt;
    this.props.updatedAt = new Date();
  }

  updateProfile(email: string | null, displayName: string): void {
    this.props.providerEmail = email;
    this.props.providerDisplayName = displayName;
    this.props.updatedAt = new Date();
  }

  toPersistence(): SocialIdentityProps {
    return { ...this.props };
  }
}
