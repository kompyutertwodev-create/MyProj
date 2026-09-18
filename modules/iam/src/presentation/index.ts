import { Router } from 'express';
import {
  createAuthRouter,
  type AuthRouterDependencies,
} from './http/controllers/AuthController.js';
import { createOAuthRouter } from './http/controllers/OAuthController.js';
import { createPolicyRouter } from './http/controllers/PolicyController.js';
import { createUserRouter } from './http/controllers/UserController.js';
import { createRoleRouter } from './http/controllers/RoleController.js';
import { createPermissionRouter } from './http/controllers/PermissionController.js';
import type { GetUserHandler } from '../application/queries/get-user/GetUserHandler.js';
import type { ListUsersHandler } from '../application/queries/list-users/ListUsersHandler.js';
import type { CheckPermissionHandler } from '../application/queries/check-permission/CheckPermissionHandler.js';
import type { OAuthProviderRegistry } from '../application/strategies/OAuthProviderRegistry.js';
import type { OAuthLoginHandler } from '../application/commands/oauth-login/OAuthLoginHandler.js';
import type { LinkSocialAccountHandler } from '../application/commands/link-social-account/LinkSocialAccountHandler.js';
import type { PolicyService } from '../application/services/PolicyService.js';
import type { AssignRoleHandler } from '../application/commands/assign-role/AssignRoleHandler.js';
import type { OAuthStateRepository } from '../domain/oauth/OAuthStateRepository.js';
import type { CreatePolicyHandler } from '../application/commands/policy/create-policy/CreatePolicyHandler.js';
import type { UpdatePolicyHandler } from '../application/commands/policy/update-policy/UpdatePolicyHandler.js';
import type { DeletePolicyHandler } from '../application/commands/policy/delete-policy/DeletePolicyHandler.js';
import type { ActivatePolicyHandler } from '../application/commands/policy/activate-policy/ActivatePolicyHandler.js';
import type { DeactivatePolicyHandler } from '../application/commands/policy/deactivate-policy/DeactivatePolicyHandler.js';
import type { ListPoliciesHandler } from '../application/queries/policy/list-policies/ListPoliciesHandler.js';
import type { GetPolicyHandler } from '../application/queries/policy/get-policy/GetPolicyHandler.js';
import type { ListRolesHandler } from '../application/queries/role/list-roles/ListRolesHandler.js';
import type { InitiateOAuthHandler } from '../application/commands/oauth-initiate/InitiateOAuthHandler.js';

export interface IamRouterDependencies {
  auth: AuthRouterDependencies;
  getUser: GetUserHandler;
  listUsers: ListUsersHandler;
  assignRole: AssignRoleHandler;
  listRoles: ListRolesHandler;
  checkPermission: CheckPermissionHandler;
  oauth?: {
    initiateOAuth: InitiateOAuthHandler;
    registry: OAuthProviderRegistry;
    stateRepository: OAuthStateRepository;
    login: OAuthLoginHandler;
    link: LinkSocialAccountHandler;
  };
  policy?: {
    createPolicy: CreatePolicyHandler;
    updatePolicy: UpdatePolicyHandler;
    deletePolicy: DeletePolicyHandler;
    activatePolicy: ActivatePolicyHandler;
    deactivatePolicy: DeactivatePolicyHandler;
    listPolicies: ListPoliciesHandler;
    getPolicy: GetPolicyHandler;
    service: PolicyService;
  };
}

/** Complete IAM HTTP surface. The app composition root supplies all dependencies. */
export function createIamRouter(deps: IamRouterDependencies): Router {
  const router = Router();
  router.use('/auth', createAuthRouter(deps.auth));
  router.use(
    '/users',
    createUserRouter(deps.getUser, deps.listUsers, deps.auth.authGuard, deps.assignRole)
  );
  router.use('/roles', createRoleRouter(deps.listRoles, deps.auth.authGuard));
  router.use('/permissions', createPermissionRouter(deps.checkPermission, deps.auth.authGuard));
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
      })
    );
  }
  if (deps.policy) {
    router.use(
      '/policies',
      createPolicyRouter({
        createPolicy: deps.policy.createPolicy,
        updatePolicy: deps.policy.updatePolicy,
        deletePolicy: deps.policy.deletePolicy,
        activatePolicy: deps.policy.activatePolicy,
        deactivatePolicy: deps.policy.deactivatePolicy,
        listPolicies: deps.policy.listPolicies,
        getPolicy: deps.policy.getPolicy,
        policyService: deps.policy.service,
        authGuard: deps.auth.authGuard,
      })
    );
  }
  return router;
}

export { createOAuthRouter } from './http/controllers/OAuthController.js';
export { createPolicyRouter } from './http/controllers/PolicyController.js';
export { createAuthRouter } from './http/controllers/AuthController.js';
export type { AuthRouterDependencies } from './http/controllers/AuthController.js';
export { createAuthGuard } from './http/middleware/AuthGuard.js';
export { requireRole } from './http/middleware/RoleGuard.js';
export { requirePermission } from './http/middleware/PermissionGuard.js';
