/**
 * @workspace/iam — public surface for apps/api
 *
 * Only export what the composition root needs to mount routes and middleware.
 * Internal domain/application/infrastructure details stay internal.
 */

// HTTP router factories
export { createOAuthRouter } from './presentation/http/controllers/OAuthController.js';
export { createPolicyRouter } from './presentation/http/controllers/PolicyController.js';
export { createIamRouter } from './presentation/index.js';
export type { IamRouterDependencies } from './presentation/index.js';

// Middleware factories (apps/api uses these to protect its own routes)
export { createAuthGuard } from './presentation/http/middleware/AuthGuard.js';
export { requireRole } from './presentation/http/middleware/RoleGuard.js';
export { requirePermission } from './presentation/http/middleware/PermissionGuard.js';

// OAuth infrastructure — so apps/api can instantiate and register providers
export { OAuthProviderRegistry } from './application/strategies/OAuthProviderRegistry.js';
export { GoogleOAuthProvider } from './infrastructure/oauth/GoogleOAuthProvider.js';
export { GitHubOAuthProvider } from './infrastructure/oauth/GitHubOAuthProvider.js';
export { TelegramOAuthProvider } from './infrastructure/oauth/TelegramOAuthProvider.js';

// Application handlers — apps/api instantiates and passes to router factories
export { OAuthLoginHandler } from './application/commands/oauth-login/OAuthLoginHandler.js';
export { LinkSocialAccountHandler } from './application/commands/link-social-account/LinkSocialAccountHandler.js';
export { InitiateOAuthHandler } from './application/commands/oauth-initiate/InitiateOAuthHandler.js';
export { CreatePolicyHandler } from './application/commands/policy/create-policy/CreatePolicyHandler.js';
export { UpdatePolicyHandler } from './application/commands/policy/update-policy/UpdatePolicyHandler.js';
export { DeletePolicyHandler } from './application/commands/policy/delete-policy/DeletePolicyHandler.js';
export { ActivatePolicyHandler } from './application/commands/policy/activate-policy/ActivatePolicyHandler.js';
export { DeactivatePolicyHandler } from './application/commands/policy/deactivate-policy/DeactivatePolicyHandler.js';
export { ListPoliciesHandler } from './application/queries/policy/list-policies/ListPoliciesHandler.js';
export { GetPolicyHandler } from './application/queries/policy/get-policy/GetPolicyHandler.js';
export { ListRolesHandler } from './application/queries/role/list-roles/ListRolesHandler.js';

// Policy service — shared across modules for permission checks
export { PolicyService } from './application/services/PolicyService.js';
export { RegisterUserHandler } from './application/commands/register-user/RegisterUserHandler.js';
export { AssignRoleHandler } from './application/commands/assign-role/AssignRoleHandler.js';
export { SetInitialPasswordHandler } from './application/commands/set-initial-password/SetInitialPasswordHandler.js';
export { LoginUserHandler } from './application/commands/login-user/LoginUserHandler.js';
export { LogoutUserHandler } from './application/commands/logout-user/LogoutUserHandler.js';
export { ChangePasswordHandler } from './application/commands/change-password/ChangePasswordHandler.js';
export { AuthService } from './application/services/AuthService.js';
export { CheckPermissionHandler } from './application/queries/check-permission/CheckPermissionHandler.js';
export { GetUserHandler } from './application/queries/get-user/GetUserHandler.js';
export { ListUsersHandler } from './application/queries/list-users/ListUsersHandler.js';
export { InMemoryIamEventBus } from './infrastructure/messaging/InMemoryIamEventBus.js';

// DB schema tables — for Drizzle migration / apps/api drizzle config
export {
  identities,
  roles,
  permissions,
  sessions,
  socialIdentities,
  policies,
  oauthStates,
} from './infrastructure/index.js';

// Repository implementations — for DI in apps/api
export {
  DrizzleUserRepository,
  DrizzleRoleRepository,
  DrizzleSessionRepository,
  DrizzleSocialIdentityRepository,
  DrizzlePolicyRepository,
  DrizzleOAuthStateRepository,
  DrizzleOutboxRepository,
  BcryptPasswordHasher,
  IamJwtService,
  InMemoryUserRepository,
  InMemoryRoleRepository,
  InMemorySessionRepository,
  InMemorySocialIdentityRepository,
  InMemoryPolicyRepository,
  InMemoryOAuthStateRepository,
  seedDefaultRbac,
  DrizzleIamUnitOfWork,
} from './infrastructure/index.js';

// Type exports apps/api needs for typed request handlers
export type { OAuthProvider } from './domain/oauth/OAuthProvider.js';
export type { OAuthStateRepository } from './domain/oauth/OAuthStateRepository.js';
export type { PolicyEvaluationContext } from './domain/policy/PolicyEvaluationContext.js';
export { PolicyEffect } from './domain/policy/PolicyEffect.js';
