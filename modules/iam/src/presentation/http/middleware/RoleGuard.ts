import type { Request, Response, NextFunction } from 'express';

/**
 * RBAC middleware — checks that req.user has at least one of the required roles.
 * Must be applied AFTER AuthGuard.
 *
 * Usage:
 *   router.get("/admin", authGuard, requireRole("admin"), handler)
 *   router.get("/mod", authGuard, requireRole("admin", "moderator"), handler)
 */
export function requireRole(...allowedRoles: string[]) {
  return function roleGuard(req: Request, res: Response, next: NextFunction): void {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    const hasRole = req.user.roles.some((r) => allowedRoles.includes(r));
    if (!hasRole) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Required role(s): ${allowedRoles.join(', ')}`,
        },
      });
      return;
    }

    next();
  };
}
