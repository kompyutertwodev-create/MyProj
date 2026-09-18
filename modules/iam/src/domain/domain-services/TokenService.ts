export interface TokenPayload {
  userId: string;
  roles: string[];
}

export interface RefreshTokenPayload {
  userId: string;
  sessionId: string;
}

export interface DomainTokenService {
  generateAccessToken(userId: string, roles: string[]): Promise<string>;
  generateRefreshToken(userId: string, sessionId: string): Promise<string>;
  verifyAccessToken(token: string): Promise<TokenPayload>;
  verifyRefreshToken(token: string): Promise<RefreshTokenPayload>;
}
