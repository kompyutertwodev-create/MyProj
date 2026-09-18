import {
  Router,
  type Request,
  type Response,
  type NextFunction,
  type RequestHandler,
} from 'express';
import { PolicyService } from '../../../application/services/PolicyService.js';
import { requireRole } from '../middleware/RoleGuard.js';
import { validateRequest } from '../middleware/ValidateRequest.js';
import {
  CreatePolicyRequestSchema,
  UpdatePolicyRequestSchema,
  EvaluatePolicyRequestSchema,
  ListPoliciesRequestSchema,
  PolicyIdRequestSchema,
} from '../validators/index.js';
import type { CreatePolicyHandler } from '../../../application/commands/policy/create-policy/CreatePolicyHandler.js';
import type { UpdatePolicyHandler } from '../../../application/commands/policy/update-policy/UpdatePolicyHandler.js';
import type { DeletePolicyHandler } from '../../../application/commands/policy/delete-policy/DeletePolicyHandler.js';
import type { ActivatePolicyHandler } from '../../../application/commands/policy/activate-policy/ActivatePolicyHandler.js';
import type { DeactivatePolicyHandler } from '../../../application/commands/policy/deactivate-policy/DeactivatePolicyHandler.js';
import type { ListPoliciesHandler } from '../../../application/queries/policy/list-policies/ListPoliciesHandler.js';
import type { GetPolicyHandler } from '../../../application/queries/policy/get-policy/GetPolicyHandler.js';

interface AuthenticatedRequest extends Request {
  user?: { userId: string; roles: string[] };
}

interface PolicyControllerDependencies {
  createPolicy: CreatePolicyHandler;
  updatePolicy: UpdatePolicyHandler;
  deletePolicy: DeletePolicyHandler;
  activatePolicy: ActivatePolicyHandler;
  deactivatePolicy: DeactivatePolicyHandler;
  listPolicies: ListPoliciesHandler;
  getPolicy: GetPolicyHandler;
  policyService: PolicyService;
  authGuard: RequestHandler;
}

function sendResult(res: Response, result: any): void {
  if (result.isOk()) {
    res.json({ success: true, data: result.value });
  } else {
    res.status(result.error.statusCode ?? 500).json({
      success: false,
      error: {
        code: result.error.code,
        message: result.error.message,
      },
    });
  }
}

/**
 * ABAC Policy management routes.
 *
 * GET    /policies                — list policies (admin only)
 * POST   /policies                — create policy (admin only)
 * GET    /policies/:id            — get policy by id (admin only)
 * PUT    /policies/:id            — update policy (admin only)
 * DELETE /policies/:id            — delete policy (admin only)
 * PATCH  /policies/:id/activate   — activate policy (admin only)
 * PATCH  /policies/:id/deactivate — deactivate policy (admin only)
 * POST   /policies/evaluate       — evaluate access for a given context (admin/system)
 */
export function createPolicyRouter(deps: PolicyControllerDependencies): Router {
  const router = Router();
  const adminGuard = [deps.authGuard, requireRole('admin')];

  /** GET /policies */
  router.get(
    '/',
    ...adminGuard,
    validateRequest(ListPoliciesRequestSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const query = req.validated?.query;
        const result = await deps.listPolicies.execute(query);
        sendResult(res, result);
      } catch (err) {
        next(err);
      }
    }
  );

  /** POST /policies */
  router.post(
    '/',
    ...adminGuard,
    validateRequest(CreatePolicyRequestSchema),
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const userId = req.user?.userId ?? 'system';
        const body = req.validated?.body;
        const result = await deps.createPolicy.execute({ ...body, createdBy: userId });
        if (result.isOk()) {
          res.status(201).json({ success: true, data: result.value.toPersistence() });
        } else {
          sendResult(res, result);
        }
      } catch (err) {
        next(err);
      }
    }
  );

  /** GET /policies/:id */
  router.get(
    '/:id',
    ...adminGuard,
    validateRequest(PolicyIdRequestSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id } = req.validated?.params;
        const result = await deps.getPolicy.execute(id);
        if (result.isOk()) {
          res.json({ success: true, data: result.value.toPersistence() });
        } else {
          sendResult(res, result);
        }
      } catch (err) {
        next(err);
      }
    }
  );

  /** PUT /policies/:id */
  router.put(
    '/:id',
    ...adminGuard,
    validateRequest(UpdatePolicyRequestSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id } = req.validated?.params;
        const body = req.validated?.body;
        const result = await deps.updatePolicy.execute({ id, ...body });
        if (result.isOk()) {
          res.json({ success: true, data: result.value.toPersistence() });
        } else {
          sendResult(res, result);
        }
      } catch (err) {
        next(err);
      }
    }
  );

  /** DELETE /policies/:id */
  router.delete(
    '/:id',
    ...adminGuard,
    validateRequest(PolicyIdRequestSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id } = req.validated?.params;
        const result = await deps.deletePolicy.execute({ id });
        sendResult(res, result);
      } catch (err) {
        next(err);
      }
    }
  );

  /** PATCH /policies/:id/activate */
  router.patch(
    '/:id/activate',
    ...adminGuard,
    validateRequest(PolicyIdRequestSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id } = req.validated?.params;
        const result = await deps.activatePolicy.execute({ id });
        if (result.isOk()) {
          res.json({ success: true, data: result.value.toPersistence() });
        } else {
          sendResult(res, result);
        }
      } catch (err) {
        next(err);
      }
    }
  );

  /** PATCH /policies/:id/deactivate */
  router.patch(
    '/:id/deactivate',
    ...adminGuard,
    validateRequest(PolicyIdRequestSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id } = req.validated?.params;
        const result = await deps.deactivatePolicy.execute({ id });
        if (result.isOk()) {
          res.json({ success: true, data: result.value.toPersistence() });
        } else {
          sendResult(res, result);
        }
      } catch (err) {
        next(err);
      }
    }
  );

  /**
   * POST /policies/evaluate
   * Body: { userId, resource, action, context? }
   * Returns: { allowed: boolean }
   */
  router.post(
    '/evaluate',
    deps.authGuard,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const { userId, resource, action, context } = EvaluatePolicyRequestSchema.parse(req.body);

        const isAdmin = req.user?.roles.includes('admin') ?? false;
        const effectiveUserId = isAdmin ? userId : req.user?.userId;
        if (!effectiveUserId || (!isAdmin && userId && userId !== req.user?.userId)) {
          res.status(403).json({
            success: false,
            error: { code: 'FORBIDDEN', message: 'You may only evaluate your own access' },
          });
          return;
        }

        const allowed = await deps.policyService.canAccess(
          effectiveUserId,
          resource,
          action,
          context
        );
        res.json({ success: true, data: { allowed } });
      } catch (err) {
        next(err);
      }
    }
  );

  return router;
}
