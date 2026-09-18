import {
  Router,
  type Request,
  type Response,
  type NextFunction,
  type RequestHandler,
} from 'express';
import type { ListAuditLogsHandler } from '../../../application/queries/list-audit-logs/ListAuditLogsHandler.js';
import type { AuditEventType } from '../../../domain/AuditEventType.js';
import { validateRequest } from '../middleware/ValidateRequest.js';
import { ListAuditLogsRequestSchema } from '../validators/index.js';

export interface AuditRouterDependencies {
  listAuditLogs: ListAuditLogsHandler;
  authGuard: RequestHandler;
}

export function createAuditRouter(deps: AuditRouterDependencies): Router {
  const router = Router();

  // GET / — list audit logs with filters and pagination
  router.get(
    '/',
    deps.authGuard,
    validateRequest(ListAuditLogsRequestSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const query = req.validated?.query as {
          page: number;
          pageSize: number;
          actorId?: string;
          tenantId?: string;
          eventType?: AuditEventType;
          targetType?: string;
          targetId?: string;
          from?: Date;
          to?: Date;
        };
        const result = await deps.listAuditLogs.execute({
          page: query.page,
          pageSize: query.pageSize,
          actorId: query.actorId,
          tenantId: query.tenantId,
          eventType: query.eventType,
          targetType: query.targetType,
          targetId: query.targetId,
          from: query.from,
          to: query.to,
        });
        res.status(200).json({ success: true, data: result });
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}
