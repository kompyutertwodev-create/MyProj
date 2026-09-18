/**
 * @workspace/tenant — public surface for apps/api
 *
 * Only export what the composition root needs to mount routes and wire DI.
 */

// HTTP router factories
export { createTenantRouter, createTenantHttpRouter } from './presentation/index.js';
export type { TenantRouterDependencies } from './presentation/index.js';

// Application handlers — apps/api instantiates and passes to router factories
export { CreateTenantHandler } from './application/commands/create-tenant/CreateTenantHandler.js';
export { GetTenantHandler } from './application/queries/get-tenant/GetTenantHandler.js';
export { ListTenantsHandler } from './application/queries/list-tenants/ListTenantsHandler.js';
export { ListMembersHandler } from './application/queries/list-members/ListMembersHandler.js';

// Application views (DTOs)
export type { TenantView } from './application/queries/TenantView.js';
export type { MemberView } from './application/queries/MemberView.js';

// Domain — public aggregates, value objects, enums
export { Tenant } from './domain/Tenant.js';
export { Member } from './domain/Member.js';
export { TenantId } from './domain/TenantId.js';
export { MemberId } from './domain/MemberId.js';
export { TenantName } from './domain/TenantName.js';
export { TenantSlug } from './domain/TenantSlug.js';
export { TenantSettings } from './domain/TenantSettings.js';
export { TenantStatus } from './domain/TenantStatus.js';
export { MemberRole } from './domain/MemberRole.js';
export { MemberStatus } from './domain/MemberStatus.js';
export type { TenantRepository } from './domain/repositories/TenantRepository.js';
export type { MemberRepository } from './domain/repositories/MemberRepository.js';

// Repository implementations — for DI in apps/api
export { DrizzleTenantRepository } from './infrastructure/repositories/DrizzleTenantRepository.js';
export { DrizzleMemberRepository } from './infrastructure/repositories/DrizzleMemberRepository.js';
export { InMemoryTenantRepository } from './infrastructure/repositories/InMemoryTenantRepository.js';
export { InMemoryMemberRepository } from './infrastructure/repositories/InMemoryMemberRepository.js';

// DB schema tables — for Drizzle migrations
export { tenants, members } from './infrastructure/database/schema/index.js';
