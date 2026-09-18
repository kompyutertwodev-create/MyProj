import { Router, type Request, type RequestHandler } from 'express';
import type { CheckPermissionHandler } from '../../../application/queries/check-permission/CheckPermissionHandler.js';
import { validateRequest } from '../middleware/ValidateRequest.js';
import { CheckPermissionRequestSchema } from '../validators/permission/index.js';

interface AuthenticatedRequest extends Request {
  user?: { userId: string; roles: string[] };
}

export function createPermissionRouter(
  checkPermission: CheckPermissionHandler,
  authGuard: RequestHandler
): Router {
  const router = Router();
  router.post(
    '/check',
    authGuard,
    validateRequest(CheckPermissionRequestSchema),
    async (req: AuthenticatedRequest, res, next) => {
      try {
        const { userId, permission } = req.validated?.body;
        if (req.user?.userId !== userId && !req.user?.roles.includes('admin')) {
          res.status(403).json({
            success: false,
            error: { code: 'FORBIDDEN', message: 'You may only check your own permissions' },
          });
          return;
        }
        const allowed = await checkPermission.execute({ userId, permission });
        res.json({ success: true, data: { allowed } });
      } catch (error) {
        next(error);
      }
    }
  );
  return router;
}
