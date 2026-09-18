import type { Request, Response, NextFunction } from 'express';
import type { PolicyService } from '../../../application/services/PolicyService.js';

/**
 * ABAC / RBAC permission middleware — evaluates the full policy engine.
 * Must be applied AFTER AuthGuard.
 *
 * Usage:
 *   router.delete("/:id", authGuard, requirePermission(policyService, "content", "delete"), handler)
 */
export function requirePermission(
  policyService: PolicyService,
  resource: string,
  action: string,
  getResourceContext?: (req: Request) => Record<string, unknown>
) {
  return async function permissionGuard(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    const resourceContext = getResourceContext?.(req) ?? {};
    const allowed = await policyService.canAccess(req.user.userId, resource, action, {
      resource: { type: resource, ...resourceContext },
    });

    if (!allowed) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Access denied: ${resource}:${action}`,
        },
      });
      return;
    }

    next();
  };
}
