import {
  Router,
  type Request,
  type Response,
  type NextFunction,
  type RequestHandler,
} from 'express';
import type { CreateTenantHandler } from '../../../application/commands/create-tenant/CreateTenantHandler.js';
import type { GetTenantHandler } from '../../../application/queries/get-tenant/GetTenantHandler.js';
import type { ListTenantsHandler } from '../../../application/queries/list-tenants/ListTenantsHandler.js';
import type { ListMembersHandler } from '../../../application/queries/list-members/ListMembersHandler.js';
import { validateRequest } from '../middleware/ValidateRequest.js';
import {
  CreateTenantRequestSchema,
  GetTenantRequestSchema,
  ListTenantsRequestSchema,
  ListMembersRequestSchema,
} from '../validators/index.js';

export interface TenantRouterDependencies {
  createTenant: CreateTenantHandler;
  getTenant: GetTenantHandler;
  listTenants: ListTenantsHandler;
  listMembers: ListMembersHandler;
  authGuard: RequestHandler;
}

function sendResult(
  res: Response,
  result: {
    isOk(): boolean;
    value?: unknown;
    error?: { statusCode?: number; code?: string; message: string };
  }
): void {
  if (!result.isOk()) {
    const error = result.error;
    res.status(error?.statusCode ?? 500).json({
      success: false,
      error: {
        code: error?.code ?? 'INTERNAL_ERROR',
        message: error?.message ?? 'Request failed',
      },
    });
    return;
  }
  res.status(200).json({ success: true, data: result.value });
}

export function createTenantRouter(deps: TenantRouterDependencies): Router {
  const router = Router();

  // POST / — create a new tenant
  router.post(
    '/',
    deps.authGuard,
    validateRequest(CreateTenantRequestSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const body = req.validated?.body as {
          name: string;
          slug: string;
          ownerUserId: string;
          settings?: {
            locale?: string;
            timezone?: string;
            currency?: string;
            logoUrl?: string | null;
            primaryColor?: string | null;
          };
        };
        sendResult(res, await deps.createTenant.execute(body));
      } catch (error) {
        next(error);
      }
    }
  );

  // GET / — list tenants (paginated)
  router.get(
    '/',
    deps.authGuard,
    validateRequest(ListTenantsRequestSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const query = req.validated?.query as {
          page: number;
          pageSize: number;
          search?: string | null;
          status?: import('../../../domain/index.js').TenantStatus;
        };
        const result = await deps.listTenants.execute({
          page: query.page,
          pageSize: query.pageSize,
          search: query.search ?? undefined,
          status: query.status,
        });
        res.status(200).json({ success: true, data: result });
      } catch (error) {
        next(error);
      }
    }
  );

  // GET /:tenantId — fetch a single tenant
  router.get(
    '/:tenantId',
    deps.authGuard,
    validateRequest(GetTenantRequestSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const params = req.validated?.params as { tenantId: string };
        const tenant = await deps.getTenant.execute({ tenantId: params.tenantId });
        if (!tenant) {
          res.status(404).json({
            success: false,
            error: { code: 'NOT_FOUND', message: 'Tenant not found' },
          });
          return;
        }
        res.status(200).json({ success: true, data: tenant });
      } catch (error) {
        next(error);
      }
    }
  );

  // GET /:tenantId/members — list members of a tenant
  router.get(
    '/:tenantId/members',
    deps.authGuard,
    validateRequest(ListMembersRequestSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const params = req.validated?.params as { tenantId: string };
        const query = req.validated?.query as {
          page: number;
          pageSize: number;
          role?: import('../../../domain/index.js').MemberRole;
          status?: import('../../../domain/index.js').MemberStatus;
        };
        const members = await deps.listMembers.execute({
          tenantId: params.tenantId,
          page: query.page,
          pageSize: query.pageSize,
          role: query.role,
          status: query.status,
        });
        res.status(200).json({ success: true, data: members });
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}
