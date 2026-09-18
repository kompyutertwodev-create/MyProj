import { Router } from 'express';
import {
  createTenantRouter,
  type TenantRouterDependencies,
} from './http/controllers/TenantController.js';

export type { TenantRouterDependencies };

/** Complete Tenant HTTP surface. The composition root supplies all dependencies. */
export function createTenantHttpRouter(deps: TenantRouterDependencies): Router {
  const router = Router();
  router.use('/', createTenantRouter(deps));
  return router;
}

export { createTenantRouter } from './http/controllers/TenantController.js';
