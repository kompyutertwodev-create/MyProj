import type { Result } from '@workspace/kernel';
import { err, ok, sha256Hex } from '@workspace/kernel';
import type { LoginUserHandler } from '../commands/login-user/LoginUserHandler.js';
import type { LoginUserCommand } from '../commands/login-user/LoginUserCommand.js';
import type { LoginUserResult } from '../commands/login-user/LoginUserResult.js';
import type { LogoutUserHandler } from '../commands/logout-user/LogoutUserHandler.js';
import type { SessionRepository } from '../../domain/repositories/SessionRepository.js';
import type { UserRepository } from '../../domain/repositories/UserRepository.js';
import type { DomainTokenService } from '../../domain/domain-services/TokenService.js';
import type { AuthorizationPort } from '../ports/AuthorizationPort.js';
import type { ApplicationError } from '../ports/ApplicationError.js';
import { UnauthorizedApplicationError } from '../ports/ApplicationError.js';

const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface RefreshTokenResult {
  accessToken: string;
  refreshToken: string;
}

/**
 * Authentication facade for HTTP, GraphQL and gRPC adapters.
 *
 * Refresh tokens are addressed by their SHA-256 hash. Role claims for
 * access tokens come from {@link AuthorizationPort}, which the composition
 * root wires to @workspace/access-control. When the port is absent the
 * token is issued with no role claims (deny-by-default).
 */
export class AuthService {
  constructor(
    private readonly loginHandler: LoginUserHandler,
    private readonly logoutHandler: LogoutUserHandler,
    private readonly sessions: SessionRepository,
    private readonly users: UserRepository,
    private readonly tokens: DomainTokenService,
    private readonly authorization?: AuthorizationPort,
  ) {}

  login(command: LoginUserCommand): Promise<Result<LoginUserResult, ApplicationError>> {
    return this.loginHandler.execute(command);
  }

  logout(userId: string, sessionId: string): Promise<Result<void, ApplicationError>> {
    return this.logoutHandler.execute({ userId, sessionId });
  }

  async refreshToken(
    refreshToken: string,
  ): Promise<Result<RefreshTokenResult, ApplicationError>> {
    let tokenPayload: { userId: string; sessionId: string };
    try {
      tokenPayload = await this.tokens.verifyRefreshToken(refreshToken);
    } catch {
      return err(new UnauthorizedApplicationError('Refresh token is invalid or expired'));
    }

    const session = await this.sessions.findById(tokenPayload.sessionId);
    if (
      !session ||
      session.isExpired() ||
      session.userId !== tokenPayload.userId ||
      session.refreshTokenHash !== sha256Hex(refreshToken)
    ) {
      return err(new UnauthorizedApplicationError('Refresh token is invalid or expired'));
    }

    const user = await this.users.findById(session.userId);
    if (!user || !user.isActive()) {
      return err(new UnauthorizedApplicationError('User account is not active'));
    }

    const roleNames = this.authorization
      ? await this.authorization.getRoleNames(user.id.value)
      : [];
    const accessToken = await this.tokens.generateAccessToken(user.id.value, roleNames);
    const nextRefreshToken = await this.tokens.generateRefreshToken(
      user.id.value,
      session.id.value,
    );
    const nextExpiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
    const rotated = await this.sessions.rotate(
      session.id.value,
      sha256Hex(refreshToken),
      sha256Hex(nextRefreshToken),
      nextExpiresAt,
    );
    if (!rotated) {
      return err(new UnauthorizedApplicationError('Refresh token has already been used'));
    }

    return ok({ accessToken, refreshToken: nextRefreshToken });
  }

  async validateToken(
    token: string,
  ): Promise<Result<{ userId: string; roles: string[] }, ApplicationError>> {
    try {
      return ok(await this.tokens.verifyAccessToken(token));
    } catch {
      return err(new UnauthorizedApplicationError('Token is invalid or expired'));
    }
  }
}