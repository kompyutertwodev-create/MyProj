/**
 * @workspace/iam вЂ” public surface for apps/api.
 *
 * Owns identity, authentication and OAuth. RBAC + ABAC live in
 * @workspace/access-control; the composition root wires the two together
 * (see apps/api/src/container).
 *
 * Only export what the composition root needs to mount routes and
 * middleware. Everything else stays internal.
 */

// в”Ђв”Ђв”Ђ HTTP router factories в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
export { createOAuthRouter } from './presentation/http/controllers/OAuthController.js';
export { createIamRouter } from './presentation/index.js';
export type { IamRouterDependencies } from './presentation/index.js';

// в”Ђв”Ђв”Ђ Middleware factories в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
export { createAuthGuard } from './presentation/http/middleware/AuthGuard.js';

// в”Ђв”Ђв”Ђ OAuth infrastructure в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
export { OAuthProviderRegistry } from './application/strategies/OAuthProviderRegistry.js';
export { GoogleOAuthProvider } from './infrastructure/oauth/GoogleOAuthProvider.js';
export { GitHubOAuthProvider } from './infrastructure/oauth/GitHubOAuthProvider.js';
export { TelegramOAuthProvider } from './infrastructure/oauth/TelegramOAuthProvider.js';

// в”Ђв”Ђв”Ђ Application handlers в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
export { OAuthLoginHandler } from './application/commands/oauth-login/OAuthLoginHandler.js';
export { LinkSocialAccountHandler } from './application/commands/link-social-account/LinkSocialAccountHandler.js';
export { InitiateOAuthHandler } from './application/commands/oauth-initiate/InitiateOAuthHandler.js';
export { RegisterUserHandler } from './application/commands/register-user/RegisterUserHandler.js';
export { SetInitialPasswordHandler } from './application/commands/set-initial-password/SetInitialPasswordHandler.js';
export { LoginUserHandler } from './application/commands/login-user/LoginUserHandler.js';
export { LogoutUserHandler } from './application/commands/logout-user/LogoutUserHandler.js';
export { ChangePasswordHandler } from './application/commands/change-password/ChangePasswordHandler.js';
export { SuspendUserHandler } from './application/commands/suspend-user/SuspendUserHandler.js';
export { AuthService } from './application/services/AuthService.js';
export { GetUserHandler } from './application/queries/get-user/GetUserHandler.js';
export { GetUserByEmailHandler } from './application/queries/get-user-by-email/GetUserByEmailHandler.js';
export { ListUsersHandler } from './application/queries/list-users/ListUsersHandler.js';
export { InMemoryIamEventBus } from './infrastructure/messaging/InMemoryIamEventBus.js';

// в”Ђв”Ђв”Ђ DB schema в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
export {
  identities,
  sessions,
  socialIdentities,
  devices,
  oauthStates,
} from './infrastructure/index.js';

// в”Ђв”Ђв”Ђ Repositories в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
export {
  DrizzleUserRepository,
  DrizzleSessionRepository,
  DrizzleSocialIdentityRepository,
  DrizzleOAuthStateRepository,
  DrizzleOutboxRepository,
  BcryptPasswordHasher,
  IamJwtService,
  InMemoryUserRepository,
  InMemorySessionRepository,
  InMemorySocialIdentityRepository,
  InMemoryOAuthStateRepository,
  DrizzleIamUnitOfWork,
} from './infrastructure/index.js';

// в”Ђв”Ђв”Ђ Cross-module types в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
export type { OAuthProvider } from './domain/oauth/OAuthProvider.js';
export type { OAuthStateRepository } from './domain/oauth/OAuthStateRepository.js';
export type { UserRepository } from './domain/repositories/UserRepository.js';