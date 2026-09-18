// ─── Typed IDs ───────────────────────────────────────────────────────────────
export { UserId } from './UserId.js';
export { RoleId } from './RoleId.js';
export { SessionId } from './SessionId.js';

// ─── Value Objects ────────────────────────────────────────────────────────────
export { Email } from './Email.js';
export { PasswordHash } from './PasswordHash.js';
export { RoleName } from './RoleName.js';
export { Permission } from './Permission.js';
export { UserStatus } from './UserStatus.js';

// ─── Entities & Aggregates ────────────────────────────────────────────────────
export { User } from './User.js';
export type { UserCreateProps, UserReconstructProps } from './User.js';
export { Role } from './Role.js';
export type { RoleProps } from './Role.js';
export { Session } from './Session.js';
export type { SessionProps } from './Session.js';

// ─── Domain Events ────────────────────────────────────────────────────────────
export { UserRegisteredEvent } from './events/UserRegisteredEvent.js';
export { UserLoggedInEvent } from './events/UserLoggedInEvent.js';
export { UserLoggedOutEvent } from './events/UserLoggedOutEvent.js';
export { UserSuspendedEvent } from './events/UserSuspendedEvent.js';
export { UserActivatedEvent } from './events/UserActivatedEvent.js';
export { EmailChangedEvent } from './events/EmailChangedEvent.js';
export { PasswordChangedEvent } from './events/PasswordChangedEvent.js';

// ─── Repository Interfaces ────────────────────────────────────────────────────
export type { UserRepository, UserFilters } from './repositories/UserRepository.js';
export type { RoleRepository } from './repositories/RoleRepository.js';
export type { SessionRepository } from './repositories/SessionRepository.js';

// ─── Domain Service Interfaces ────────────────────────────────────────────────
export type { PasswordService } from './domain-services/PasswordService.js';
export type { DomainTokenService, TokenPayload } from './domain-services/TokenService.js';

// ─── Specifications ───────────────────────────────────────────────────────────
export { ActiveUserSpec } from './specifications/ActiveUserSpec.js';
export { UserWithRoleSpec } from './specifications/UserWithRoleSpec.js';
export { UserWithPermissionSpec } from './specifications/UserWithPermissionSpec.js';

// ─── OAuth / Social Identity ──────────────────────────────────────────────────
export { OAuthProvider, OAuthProviderLabel } from './oauth/OAuthProvider.js';
export type { OAuthProfile } from './oauth/OAuthProfile.js';
export { SocialIdentity } from './oauth/SocialIdentity.js';
export type { SocialIdentityProps } from './oauth/SocialIdentity.js';
export type { SocialIdentityRepository } from './oauth/SocialIdentityRepository.js';

// ─── ABAC Policy ──────────────────────────────────────────────────────────────
export { PolicyEffect } from './policy/PolicyEffect.js';
export type { AttributeCondition, ConditionOperator } from './policy/AttributeCondition.js';
export { evaluateCondition, resolvePath } from './policy/AttributeCondition.js';
export { Policy } from './policy/Policy.js';
export type { PolicyProps } from './policy/Policy.js';
export type { PolicyRepository } from './policy/PolicyRepository.js';
export type { PolicyEvaluationContext } from './policy/PolicyEvaluationContext.js';
export { flattenContext } from './policy/PolicyEvaluationContext.js';
