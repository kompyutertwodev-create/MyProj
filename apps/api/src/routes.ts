import { Router, type IRouter } from 'express';

import { createHealthRouter } from './health';

import type { AppContainer } from './container';

// This is the composition root's HTTP surface, versioned under /api/v1.

// As each module grows a presentation/http layer, mount its router here,

// e.g.:

//   import { iamRouter } from "@workspace/iam";

//   v1.use("/identity", iamRouter);

// Clients (web, admin, telegram, mobile) only ever call through this API --

// they never import a module directly.

//

// Planned /api/v1 domains -> owning module (see docs/architecture.md §9):

//   identity, auth, users            -> iam

//   billing                          -> billing

//   subscriptions                    -> subscription

//   tenant                           -> tenant

//   notifications                    -> notification

//   audit                            -> audit

//   catalog                          -> catalog

//   content                          -> content

//   viewing                          -> viewing

//   media                            -> media

//   search                           -> search

//   analytics                        -> analytics

//   access-control                   -> access-control

//   features                         -> features

//   devices                          -> devices

//   integrations                     -> integrations

//   advertising                      -> advertising

//   social                           -> social

//   admin                            -> admin

//   reports                          -> reports

//   platform, system (health/metrics/version) -> implemented directly in

//     apps/api (see health.ts) -- these are technical, not business, so

//     they don't get their own module.

export function createRoutes(container: AppContainer): IRouter {
  const router: IRouter = Router();
  const v1: IRouter = Router();

  // Health is a composition-root concern and receives the
  // application's database dependency through the container.
  router.use(createHealthRouter(container.database));

  // IAM owns identity, auth, users, RBAC and ABAC policy routes.
  // The identity alias preserves the contract's /identity namespace while
  // the root mount supports /auth and /users clients.
  v1.use('/', container.iamRouter);
  v1.use('/identity', container.iamRouter);

  // The composition root mounts this router at /api in server.ts.
  router.use('/v1', v1);

  return router;
}
