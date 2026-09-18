import type { Result } from '@workspace/kernel';
import { err, ok } from '@workspace/kernel';
import type { LoginUserHandler } from '../commands/login-user/LoginUserHandler.js';
import type { LoginUserCommand } from '../commands/login-user/LoginUserCommand.js';
import type { LoginUserResult } from '../commands/login-user/LoginUserResult.js';
import type { LogoutUserHandler } from '../commands/logout-user/LogoutUserHandler.js';
import type { SessionRepository } from '../../domain/repositories/SessionRepository.js';
import type { UserRepository } from '../../domain/repositories/UserRepository.js';
import type { DomainTokenService } from '../../domain/domain-services/TokenService.js';
import type { ApplicationError } from '../ports/ApplicationError.js';
import { UnauthorizedApplicationError } from '../ports/ApplicationError.js';

export interface RefreshTokenResult {
  accessToken: string;
  refreshToken: string;
}

/**
 * Authentication facade for HTTP, GraphQL and gRPC adapters.
 * It owns flow orchestration; adapters never manipulate sessions or JWTs directly.
 */
export class AuthService {
  constructor(
    private readonly loginHandler: LoginUserHandler,
    private readonly logoutHandler: LogoutUserHandler,
    private readonly sessions: SessionRepository,
    private readonly users: UserRepository,
    private readonly tokens: DomainTokenService
  ) {}

  login(command: LoginUserCommand): Promise<Result<LoginUserResult, ApplicationError>> {
    return this.loginHandler.execute(command);
  }

  logout(userId: string, sessionId: string): Promise<Result<void, ApplicationError>> {
    return this.logoutHandler.execute({ userId, sessionId });
  }

  async refreshToken(refreshToken: string): Promise<Result<RefreshTokenResult, ApplicationError>> {
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
      session.refreshToken !== refreshToken
    ) {
      return err(new UnauthorizedApplicationError('Refresh token is invalid or expired'));
    }

    const user = await this.users.findById(session.userId);
    if (!user || !user.isActive()) {
      return err(new UnauthorizedApplicationError('User account is not active'));
    }

    const roles = user.roles.map((role) => role.name.value);
    const accessToken = await this.tokens.generateAccessToken(user.id.value, roles);
    const nextRefreshToken = await this.tokens.generateRefreshToken(
      user.id.value,
      session.id.value
    );
    const nextExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const rotated = await this.sessions.rotate(
      session.id.value,
      refreshToken,
      nextRefreshToken,
      nextExpiresAt
    );
    if (!rotated) {
      return err(new UnauthorizedApplicationError('Refresh token has already been used'));
    }

    return ok({ accessToken, refreshToken: nextRefreshToken });
  }

  async validateToken(
    token: string
  ): Promise<Result<{ userId: string; roles: string[] }, ApplicationError>> {
    try {
      return ok(await this.tokens.verifyAccessToken(token));
    } catch {
      return err(new UnauthorizedApplicationError('Token is invalid or expired'));
    }
  }
}
