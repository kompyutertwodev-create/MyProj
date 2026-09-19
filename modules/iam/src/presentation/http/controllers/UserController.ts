import { Router, type RequestHandler } from 'express';
import type { GetUserHandler } from '../../../application/queries/get-user/GetUserHandler.js';
import type { ListUsersHandler } from '../../../application/queries/list-users/ListUsersHandler.js';
import { validateRequest } from '../middleware/ValidateRequest.js';
import {
  ListUsersRequestSchema,
  GetUserRequestSchema,
} from '../validators/index.js';

/**
 * Read-only user router.
 *
 * Role assignment is intentionally absent: it belongs to the access-control
 * module, which exposes POST /api/v1/access-control/assignments. Keeping
 * the two surfaces separate means this router never needs to know how
 * RBAC works.
 */
export function createUserRouter(
  getUser: GetUserHandler,
  listUsers: ListUsersHandler,
  authGuard: RequestHandler,
): Router {
  const router = Router();

  router.get(
    '/',
    authGuard,
    validateRequest(ListUsersRequestSchema),
    async (req, res, next) => {
      try {
        const query = req.validated?.query;
        const result = await listUsers.execute(query);
        res.json({ success: true, data: result });
      } catch (error) {
        next(error);
      }
    },
  );

  router.get(
    '/:id',
    authGuard,
    validateRequest(GetUserRequestSchema),
    async (req, res, next) => {
      try {
        const { id } = req.validated?.params;
        const user = await getUser.execute({ userId: id });
        if (!user) {
          res.status(404).json({
            success: false,
            error: { code: 'NOT_FOUND', message: 'User not found' },
          });
          return;
        }
        res.json({ success: true, data: user });
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}