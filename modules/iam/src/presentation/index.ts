import { Router } from 'express';
import {
  createAuthRouter,
  type AuthRouterDependencies,
} from './http/controllers/AuthController.js';
import { createOAuthRouter } from './http/controllers/OAuthController.js';
import { createUserRouter } from './http/controllers/UserController.js';
import type { GetUserHandler } from '../application/queries/get-user/GetUserHandler.js';
import type { ListUsersHandler } from '../application/queries/list-users/ListUsersHandler.js';
import type { OAuthProviderRegistry } from '../application/strategies/OAuthProviderRegistry.js';
import type { OAuthLoginHandler } from '../application/commands/oauth-login/OAuthLoginHandler.js';
import type { LinkSocialAccountHandler } from '../application/commands/link-social-account/LinkSocialAccountHandler.js';
import type { OAuthStateRepository } from '../domain/oauth/OAuthStateRepository.js';
import type { InitiateOAuthHandler } from '../application/commands/oauth-initiate/InitiateOAuthHandler.js';

/**
 * Dependencies the composition root must supply to mount the IAM HTTP
 * surface. RBAC (roles, permissions, ABAC policies) is deliberately absent:
 * it lives in @workspace/access-control, which owns its own router.
 */
export interface IamRouterDependencies {
  auth: AuthRouterDependencies;
  getUser: GetUserHandler;
  listUsers: ListUsersHandler;
  oauth?: {
    initiateOAuth: InitiateOAuthHandler;
    registry: OAuthProviderRegistry;
    stateRepository: OAuthStateRepository;
    login: OAuthLoginHandler;
    link: LinkSocialAccountHandler;
  };
}

/**
 * Complete IAM HTTP surface: auth, users, OAuth.
 *
 * Mounted by the composition root under `/api/v1` and `/api/v1/identity`.
 * RBAC endpoints live under `/api/v1/access-control` and are wired in a
 * separate router by apps/api.
 */
export function createIamRouter(deps: IamRouterDependencies): Router {
  const router = Router();

  router.use('/auth', createAuthRouter(deps.auth));
  router.use(
    '/users',
    createUserRouter(deps.getUser, deps.listUsers, deps.auth.authGuard),
  );

  if (deps.oauth) {
    router.use(
      '/auth/oauth',
      createOAuthRouter({
        initiateOAuth: deps.oauth.initiateOAuth,
        oauthLogin: deps.oauth.login,
        linkSocialAccount: deps.oauth.link,
        providerRegistry: deps.oauth.registry,
        stateRepository: deps.oauth.stateRepository,
        authGuard: deps.auth.authGuard,
      }),
    );
  }

  return router;
}

export { createOAuthRouter } from './http/controllers/OAuthController.js';
export { createAuthRouter } from './http/controllers/AuthController.js';
export type { AuthRouterDependencies } from './http/controllers/AuthController.js';
export { createAuthGuard } from './http/middleware/AuthGuard.js';