import type { JwtService } from '@workspace/platform';
import { JsonWebTokenService as PlatformJwtService } from '@workspace/platform';
import { randomUUID } from 'node:crypto';
import type {
  DomainTokenService,
  RefreshTokenPayload,
  TokenPayload,
} from '../../domain/domain-services/TokenService.js';

export class JsonWebTokenService implements DomainTokenService {
  constructor(private readonly jwt: JwtService = new PlatformJwtService()) {}

  async generateAccessToken(userId: string, roles: string[]): Promise<string> {
    return this.jwt.sign(
      { userId, roles, tokenType: 'access' },
      { subject: userId, expiresIn: process.env['JWT_ACCESS_TTL'] ?? '15m' }
    );
  }

  async generateRefreshToken(userId: string, sessionId: string): Promise<string> {
    return this.jwt.sign(
      { jti: randomUUID(), sessionId, tokenType: 'refresh' },
      { subject: userId, expiresIn: process.env['JWT_REFRESH_TTL'] ?? '30d' }
    );
  }

  async verifyAccessToken(token: string): Promise<TokenPayload> {
    const payload = await this.jwt.verify<TokenPayload & { tokenType?: string }>(token);
    if (payload.tokenType !== 'access') throw new Error('Invalid access token');
    return { userId: payload.userId, roles: payload.roles };
  }

  async verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    const payload = await this.jwt.verify<{ sub?: string; sessionId?: string; tokenType?: string }>(
      token
    );
    if (payload.tokenType !== 'refresh') throw new Error('Invalid refresh token');
    if (!payload.sub || !payload.sessionId) throw new Error('Refresh token subject is missing');
    return { userId: payload.sub, sessionId: payload.sessionId };
  }
}
