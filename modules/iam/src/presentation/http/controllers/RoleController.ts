import {
  Router,
  type Request,
  type Response,
  type NextFunction,
  type RequestHandler,
} from 'express';
import type { ListRolesHandler } from '../../../application/queries/role/list-roles/ListRolesHandler.js';
import { validateRequest } from '../middleware/ValidateRequest.js';
import { ListRolesRequestSchema } from '../validators/role/index.js';

export function createRoleRouter(listRoles: ListRolesHandler, authGuard: RequestHandler): Router {
  const router = Router();

  router.get(
    '/',
    authGuard,
    validateRequest(ListRolesRequestSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const query = req.validated?.query;
        const result = await listRoles.execute(query);
        res.json({ success: true, data: result });
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}
