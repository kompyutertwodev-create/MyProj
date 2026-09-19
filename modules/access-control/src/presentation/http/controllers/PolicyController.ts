import {
  Router,
  type Request,
  type Response,
  type NextFunction,
  type RequestHandler,
} from 'express';
import type { CreatePolicyHandler } from '../../../application/commands/create-policy/index.js';
import type { UpdatePolicyHandler } from '../../../application/commands/update-policy/index.js';
import type { DeletePolicyHandler } from '../../../application/commands/delete-policy/index.js';
import type { ActivatePolicyHandler } from '../../../application/commands/activate-policy/index.js';
import type { DeactivatePolicyHandler } from '../../../application/commands/deactivate-policy/index.js';
import type { GetPolicyHandler } from '../../../application/queries/get-policy/index.js';
import type { ListPoliciesHandler } from '../../../application/queries/list-policies/index.js';
import { validateRequest } from '../middleware/ValidateRequest.js';
import { sendResult } from './sendResult.js';
import {
  CreatePolicyRequestSchema,
  UpdatePolicyRequestSchema,
  DeletePolicyRequestSchema,
  ActivatePolicyRequestSchema,
  DeactivatePolicyRequestSchema,
  GetPolicyRequestSchema,
  ListPoliciesRequestSchema,
} from '../validators/policy/index.js';

export interface PolicyRouterDependencies {
  createPolicy: CreatePolicyHandler;
  updatePolicy: UpdatePolicyHandler;
  deletePolicy: DeletePolicyHandler;
  activatePolicy: ActivatePolicyHandler;
  deactivatePolicy: DeactivatePolicyHandler;
  getPolicy: GetPolicyHandler;
  listPolicies: ListPoliciesHandler;
  authGuard: RequestHandler;
}

interface ValidatedRequest {
  body?: unknown;
  query?: unknown;
  params?: unknown;
}

/**
 * Policy management router (ABAC).
 *
 * Activate / deactivate are modeled as their own POST endpoints instead of
 * a generic PATCH so the intent is explicit and the audit trail can key
 * off the route.
 */
export function createPolicyRouter(deps: PolicyRouterDependencies): Router {
  const router = Router();

  router.post(
    '/',
    deps.authGuard,
    validateRequest(CreatePolicyRequestSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { body } = req as ValidatedRequest;
        sendResult(res, await deps.createPolicy.execute(body as never), 201);
      } catch (error) {
        next(error);
      }
    },
  );

  router.get(
    '/',
    deps.authGuard,
    validateRequest(ListPoliciesRequestSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { query } = req as ValidatedRequest;
        sendResult(res, await deps.listPolicies.execute(query as never));
      } catch (error) {
        next(error);
      }
    },
  );

  router.get(
    '/:id',
    deps.authGuard,
    validateRequest(GetPolicyRequestSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { params } = req as ValidatedRequest;
        const id = (params as { id: string }).id;
        sendResult(res, await deps.getPolicy.execute({ policyId: id }));
      } catch (error) {
        next(error);
      }
    },
  );

  router.patch(
    '/:id',
    deps.authGuard,
    validateRequest(UpdatePolicyRequestSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { body, params } = req as ValidatedRequest;
        const id = (params as { id: string }).id;
        sendResult(
          res,
          await deps.updatePolicy.execute({
            policyId: id,
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
    validateRequest(DeletePolicyRequestSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { body, params } = req as ValidatedRequest;
        const id = (params as { id: string }).id;
        sendResult(
          res,
          await deps.deletePolicy.execute({
            policyId: id,
            deletedBy: (body as { deletedBy: string }).deletedBy,
          }),
        );
      } catch (error) {
        next(error);
      }
    },
  );

  router.post(
    '/:id/activate',
    deps.authGuard,
    validateRequest(ActivatePolicyRequestSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { body, params } = req as ValidatedRequest;
        const id = (params as { id: string }).id;
        sendResult(
          res,
          await deps.activatePolicy.execute({
            policyId: id,
            actorId: (body as { actorId: string }).actorId,
          }),
        );
      } catch (error) {
        next(error);
      }
    },
  );

  router.post(
    '/:id/deactivate',
    deps.authGuard,
    validateRequest(DeactivatePolicyRequestSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { body, params } = req as ValidatedRequest;
        const id = (params as { id: string }).id;
        sendResult(
          res,
          await deps.deactivatePolicy.execute({
            policyId: id,
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