import type { DomainTokenService } from '../../domain/domain-services/TokenService.js';

/** Application-facing token facade. Keeps handlers independent from JWT details. */
export class TokenService {
  constructor(private readonly tokenService: DomainTokenService) {}

  generateAccessToken(userId: string, roles: string[]): Promise<string> {
    return this.tokenService.generateAccessToken(userId, roles);
  }

  generateRefreshToken(userId: string, sessionId: string): Promise<string> {
    return this.tokenService.generateRefreshToken(userId, sessionId);
  }

  verifyAccessToken(token: string) {
    return this.tokenService.verifyAccessToken(token);
  }

  verifyRefreshToken(token: string) {
    return this.tokenService.verifyRefreshToken(token);
  }
}
