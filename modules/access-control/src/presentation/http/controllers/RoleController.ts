import {
  Router,
  type Request,
  type Response,
  type NextFunction,
  type RequestHandler,
} from 'express';
import type { CreateRoleHandler } from '../../../application/commands/create-role/index.js';
import type { UpdateRoleHandler } from '../../../application/commands/update-role/index.js';
import type { DeleteRoleHandler } from '../../../application/commands/delete-role/index.js';
import type { AddPermissionToRoleHandler } from '../../../application/commands/add-permission-to-role/index.js';
import type { RemovePermissionFromRoleHandler } from '../../../application/commands/remove-permission-from-role/index.js';
import type { GetRoleHandler } from '../../../application/queries/get-role/index.js';
import type { ListRolesHandler } from '../../../application/queries/list-roles/index.js';
import { validateRequest } from '../middleware/ValidateRequest.js';
import { sendResult } from './sendResult.js';
import {
  CreateRoleRequestSchema,
  UpdateRoleRequestSchema,
  DeleteRoleRequestSchema,
  GetRoleRequestSchema,
  ListRolesRequestSchema,
  AddPermissionToRoleRequestSchema,
  RemovePermissionFromRoleRequestSchema,
} from '../validators/role/index.js';

export interface RoleRouterDependencies {
  createRole: CreateRoleHandler;
  updateRole: UpdateRoleHandler;
  deleteRole: DeleteRoleHandler;
  addPermissionToRole: AddPermissionToRoleHandler;
  removePermissionFromRole: RemovePermissionFromRoleHandler;
  getRole: GetRoleHandler;
  listRoles: ListRolesHandler;
  authGuard: RequestHandler;
}

interface ValidatedRequest {
  body?: unknown;
  query?: unknown;
  params?: unknown;
}

/**
 * Role management router.
 *
 * Every route is guarded by `authGuard` (mounted by the composition root)
 * and validated by a Zod schema; the handler receives a fully-typed
 * command/query object and returns a Result. `sendResult` translates both
 * branches into the shared response envelope.
 */
export function createRoleRouter(deps: RoleRouterDependencies): Router {
  const router = Router();

  router.post(
    '/',
    deps.authGuard,
    validateRequest(CreateRoleRequestSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { body } = req as ValidatedRequest;
        sendResult(res, await deps.createRole.execute(body as never), 201);
      } catch (error) {
        next(error);
      }
    },
  );

  router.get(
    '/',
    deps.authGuard,
    validateRequest(ListRolesRequestSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { query } = req as ValidatedRequest;
        sendResult(res, await deps.listRoles.execute(query as never));
      } catch (error) {
        next(error);
      }
    },
  );

  router.get(
    '/:id',
    deps.authGuard,
    validateRequest(GetRoleRequestSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { params } = req as ValidatedRequest;
        const id = (params as { id: string }).id;
        sendResult(res, await deps.getRole.execute({ roleId: id }));
      } catch (error) {
        next(error);
      }
    },
  );

  router.patch(
    '/:id',
    deps.authGuard,
    validateRequest(UpdateRoleRequestSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { body, params } = req as ValidatedRequest;
        const id = (params as { id: string }).id;
        sendResult(
          res,
          await deps.updateRole.execute({
            roleId: id,
            ...(body as Record<string, unknown>),
          } as never),
        );
      } catch (error) {
        next(error);
      }
    },
  );

  router.delete(
    '/:id',
    deps.authGuard,
    validateRequest(DeleteRoleRequestSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { body, params } = req as ValidatedRequest;
        const id = (params as { id: string }).id;
        sendResult(
          res,
          await deps.deleteRole.execute({
            roleId: id,
            actorId: (body as { actorId: string }).actorId,
          }),
        );
      } catch (error) {
        next(error);
      }
    },
  );

  router.post(
    '/:id/permissions',
    deps.authGuard,
    validateRequest(AddPermissionToRoleRequestSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { body, params } = req as ValidatedRequest;
        const id = (params as { id: string }).id;
        sendResult(
          res,
          await deps.addPermissionToRole.execute({
            roleId: id,
            ...(body as Record<string, unknown>),
          } as never),
        );
      } catch (error) {
        next(error);
      }
    },
  );

  router.delete(
    '/:id/permissions/:permissionName',
    deps.authGuard,
    validateRequest(RemovePermissionFromRoleRequestSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { body, params } = req as ValidatedRequest;
        const p = params as { id: string; permissionName: string };
        sendResult(
          res,
          await deps.removePermissionFromRole.execute({
            roleId: p.id,
            permissionName: p.permissionName,
            actorId: (body as { actorId: string }).actorId,
          }),
        );
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}