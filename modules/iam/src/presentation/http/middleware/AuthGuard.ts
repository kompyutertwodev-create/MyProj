import type { Request, Response, NextFunction } from 'express';
import type { DomainTokenService as TokenService } from '../../../domain/domain-services/TokenService.js';

export interface AuthenticatedUser {
  userId: string;
  roles: string[];
}

declare module 'express' {
  interface Request {
    user?: AuthenticatedUser;
  }
}

/**
 * AuthGuard middleware — validates Bearer JWT and attaches req.user.
 * Must be applied before RoleGuard and PermissionGuard.
 */
export function createAuthGuard(tokenService: TokenService) {
  return async function authGuard(req: Request, res: Response, next: NextFunction): Promise<void> {
    const authHeader = req.headers['authorization'];
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Missing or invalid Authorization header' },
      });
      return;
    }

    const token = authHeader.slice(7);
    try {
      const payload = await tokenService.verifyAccessToken(token);
      req.user = { userId: payload.userId, roles: payload.roles };
      next();
    } catch {
      res.status(401).json({
        success: false,
        error: { code: 'TOKEN_INVALID', message: 'Token is invalid or expired' },
      });
    }
  };
}
