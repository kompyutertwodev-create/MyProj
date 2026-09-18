export class OAuthProviderError extends Error {
  readonly code = 'OAUTH_PROVIDER_ERROR';
  readonly statusCode = 502;

  constructor(
    readonly provider: string,
    readonly operation: string
  ) {
    super(`OAuth provider "${provider}" failed during ${operation}`);
    this.name = 'OAuthProviderError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class OAuthAuthenticationError extends Error {
  readonly code = 'OAUTH_AUTHENTICATION_FAILED';
  readonly statusCode = 401;

  constructor(message: string) {
    super(message);
    this.name = 'OAuthAuthenticationError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
