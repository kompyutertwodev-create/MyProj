// ─── DB Schema ────────────────────────────────────────────────────────────────
export { identities } from './database/schema/identities.table.js';
export { roles } from './database/schema/roles.table.js';
export { permissions } from './database/schema/permissions.table.js';
export { sessions } from './database/schema/sessions.table.js';
export { socialIdentities } from './database/schema/social_identities.table.js';
export { policies } from './database/schema/policies.table.js';
export { oauthStates } from './database/schema/oauth_states.table.js';
export { outboxEvents } from './database/schema/outbox-events.table.js';

// ─── Repositories ─────────────────────────────────────────────────────────────
export { DrizzleUserRepository } from './repositories/DrizzleUserRepository.js';
export { DrizzleRoleRepository } from './repositories/DrizzleRoleRepository.js';
export { DrizzleSessionRepository } from './repositories/DrizzleSessionRepository.js';
export { DrizzleSocialIdentityRepository } from './repositories/DrizzleSocialIdentityRepository.js';
export { DrizzlePolicyRepository } from './repositories/DrizzlePolicyRepository.js';
export { DrizzleOAuthStateRepository } from './repositories/DrizzleOAuthStateRepository.js';
export { DrizzleOutboxRepository } from './repositories/DrizzleOutboxRepository.js';
export { InMemoryUserRepository } from './repositories/InMemoryUserRepository.js';
export { InMemoryRoleRepository } from './repositories/InMemoryRoleRepository.js';
export { InMemorySessionRepository } from './repositories/InMemorySessionRepository.js';
export { InMemorySocialIdentityRepository } from './repositories/InMemorySocialIdentityRepository.js';
export { InMemoryPolicyRepository } from './repositories/InMemoryPolicyRepository.js';
export { InMemoryOAuthStateRepository } from './repositories/InMemoryOAuthStateRepository.js';
export { seedDefaultRbac } from './database/seed/RbacSeeder.js';
export { DrizzleIamUnitOfWork } from './database/DrizzleIamUnitOfWork.js';

// ─── Mappers ──────────────────────────────────────────────────────────────────
export { UserMapper } from './mappers/UserMapper.js';
export { RoleMapper } from './mappers/RoleMapper.js';

// ─── Security ─────────────────────────────────────────────────────────────────
export { BcryptPasswordHasher } from './security/BcryptPasswordHasher.js';
export { JsonWebTokenService as IamJwtService } from './security/JsonWebTokenService.js';
export { SecureRandomGenerator } from './security/SecureRandomGenerator.js';

// ─── OAuth Providers ──────────────────────────────────────────────────────────
export { GoogleOAuthProvider } from './oauth/GoogleOAuthProvider.js';
export { GitHubOAuthProvider } from './oauth/GitHubOAuthProvider.js';
export { TelegramOAuthProvider } from './oauth/TelegramOAuthProvider.js';

// ─── Cache ────────────────────────────────────────────────────────────────────
export { MemorySessionCache } from './cache/MemorySessionCache.js';
export { RedisSessionCache } from './cache/RedisSessionCache.js';
export { InMemoryIamEventBus } from './messaging/InMemoryIamEventBus.js';
