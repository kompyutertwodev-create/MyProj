import {
  Router,
  type Request,
  type Response,
  type NextFunction,
  type RequestHandler,
} from 'express';
import type { AssignRoleHandler } from '../../../application/commands/assign-role/index.js';
import type { RevokeRoleHandler } from '../../../application/commands/revoke-role/index.js';
import type { ListUserRolesHandler } from '../../../application/queries/list-user-roles/index.js';
import type { ListRoleAssignmentsHandler } from '../../../application/queries/list-role-assignments/index.js';
import { validateRequest } from '../middleware/ValidateRequest.js';
import { sendResult } from './sendResult.js';
import {
  AssignRoleRequestSchema,
  RevokeRoleRequestSchema,
  ListUserRolesRequestSchema,
  ListRoleAssignmentsRequestSchema,
} from '../validators/assignment/index.js';

export interface AssignmentRouterDependencies {
  assignRole: AssignRoleHandler;
  revokeRole: RevokeRoleHandler;
  listUserRoles: ListUserRolesHandler;
  listRoleAssignments: ListRoleAssignmentsHandler;
  authGuard: RequestHandler;
}

interface ValidatedRequest {
  body?: unknown;
  query?: unknown;
  params?: unknown;
}

/**
 * Role assignment router.
 *
 * Exposes two symmetric views:
 *   - GET /users/:userId/roles     вЂ” what does this user have?
 *   - GET /roles/:roleId/assignments вЂ” who has this role?
 *
 * Both accept `includeInactive=true` to include revoked/expired rows for
 * admin and audit views.
 */
export function createAssignmentRouter(deps: AssignmentRouterDependencies): Router {
  const router = Router();

  router.post(
    '/',
    deps.authGuard,
    validateRequest(AssignRoleRequestSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { body } = req as ValidatedRequest;
        sendResult(res, await deps.assignRole.execute(body as never), 201);
      } catch (error) {
        next(error);
      }
    },
  );

  router.delete(
    '/:id',
    deps.authGuard,
    validateRequest(RevokeRoleRequestSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { body, params } = req as ValidatedRequest;
        const id = (params as { id: string }).id;
        sendResult(
          res,
          await deps.revokeRole.execute({
            assignmentId: id,
            revokedBy: (body as { revokedBy: string }).revokedBy,
            reason: (body as { reason?: string }).reason,
          }),
        );
      } catch (error) {
        next(error);
      }
    },
  );

  router.get(
    '/users/:userId/roles',
    deps.authGuard,
    validateRequest(ListUserRolesRequestSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { params, query } = req as ValidatedRequest;
        const userId = (params as { userId: string }).userId;
        const includeInactive = (query as { includeInactive?: boolean }).includeInactive ?? false;
        sendResult(res, await deps.listUserRoles.execute({ userId, includeInactive }));
      } catch (error) {
        next(error);
      }
    },
  );

  router.get(
    '/roles/:roleId/assignments',
    deps.authGuard,
    validateRequest(ListRoleAssignmentsRequestSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { params, query } = req as ValidatedRequest;
        const roleId = (params as { roleId: string }).roleId;
        const includeInactive = (query as { includeInactive?: boolean }).includeInactive ?? false;
        sendResult(res, await deps.listRoleAssignments.execute({ roleId, includeInactive }));
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}