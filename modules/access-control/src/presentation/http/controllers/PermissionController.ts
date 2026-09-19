import {
  Router,
  type Request,
  type Response,
  type NextFunction,
  type RequestHandler,
} from 'express';
import type { CheckPermissionHandler } from '../../../application/queries/check-permission/index.js';
import { validateRequest } from '../middleware/ValidateRequest.js';
import { sendResult } from './sendResult.js';
import { CheckPermissionRequestSchema } from '../validators/permission/index.js';

export interface PermissionRouterDependencies {
  checkPermission: CheckPermissionHandler;
  authGuard: RequestHandler;
}

interface ValidatedRequest {
  body?: unknown;
}

/**
 * Permission check router.
 *
 * Intentionally POST (not GET) because the request may carry resource and
 * environment attributes that are not idempotent to encode in a URL, and
 * because the check itself is cheap but not free вЂ” POST lets clients cache
 * the result without treating it as a public resource.
 */
export function createPermissionRouter(deps: PermissionRouterDependencies): Router {
  const router = Router();

  router.post(
    '/check',
    deps.authGuard,
    validateRequest(CheckPermissionRequestSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { body } = req as ValidatedRequest;
        sendResult(res, await deps.checkPermission.execute(body as never));
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}