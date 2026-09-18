import { Router, type RequestHandler } from 'express';
import type { GetUserHandler } from '../../../application/queries/get-user/GetUserHandler.js';
import type { ListUsersHandler } from '../../../application/queries/list-users/ListUsersHandler.js';
import type { AssignRoleHandler } from '../../../application/commands/assign-role/AssignRoleHandler.js';
import { requireRole } from '../middleware/RoleGuard.js';
import { validateRequest } from '../middleware/ValidateRequest.js';
import {
  ListUsersRequestSchema,
  GetUserRequestSchema,
  AssignRoleRequestSchema,
} from '../validators/index.js';

export function createUserRouter(
  getUser: GetUserHandler,
  listUsers: ListUsersHandler,
  authGuard: RequestHandler,
  assignRole: AssignRoleHandler
): Router {
  const router = Router();
  router.get(
    '/',
    authGuard,
    requireRole('admin'),
    validateRequest(ListUsersRequestSchema),
    async (req, res, next) => {
      try {
        const query = req.validated?.query;
        const result = await listUsers.execute(query);
        res.json({ success: true, data: result });
      } catch (error) {
        next(error);
      }
    }
  );
  router.get(
    '/:id',
    authGuard,
    requireRole('admin'),
    validateRequest(GetUserRequestSchema),
    async (req, res, next) => {
      try {
        const { id } = req.validated?.params;
        const user = await getUser.execute({ userId: id });
        if (!user) {
          res
            .status(404)
            .json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } });
          return;
        }
        res.json({ success: true, data: user });
      } catch (error) {
        next(error);
      }
    }
  );
  router.post(
    '/:id/roles',
    authGuard,
    requireRole('admin'),
    validateRequest(AssignRoleRequestSchema),
    async (req, res, next) => {
      try {
        const { id } = req.validated?.params;
        const { roleName } = req.validated?.body;
        const result = await assignRole.execute({ userId: id, roleName });
        if (result.isErr()) {
          res.status(result.error.statusCode ?? 500).json({
            success: false,
            error: {
              code: result.error.code,
              message: result.error.message,
            },
          });
          return;
        }
        res.status(200).json({ success: true, data: { userId: id, roleName } });
      } catch (error) {
        next(error);
      }
    }
  );
  return router;
}
