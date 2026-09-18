import { Router, type IRouter } from 'express';

import { createHealthRouter } from './health';

import type { AppContainer } from './container';

/**
 * This is the composition root's HTTP surface, versioned under /api/v1.
 *
 * Each module owns its own router; this file only mounts them.
 */
export function createRoutes(container: AppContainer): IRouter {
  const router: IRouter = Router();
  const v1: IRouter = Router();

  // Health is a composition-root concern.
  router.use(createHealthRouter(container.database));

  // IAM owns identity, auth, users, RBAC and ABAC policy routes.
  v1.use('/', container.iamRouter);
  v1.use('/identity', container.iamRouter);

  // Tenant owns tenant and membership routes.
  v1.use('/tenants', container.tenantRouter);

  // The composition root mounts this router at /api in server.ts.
  router.use('/v1', v1);

  return router;
}
