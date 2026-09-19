/**
 * @workspace/tenant вЂ” public surface for apps/api
 *
 * Only export what the composition root needs to mount routes and wire DI.
 */

// HTTP router factories
export { createTenantRouter, createTenantHttpRouter } from './presentation/index.js';
export type { TenantRouterDependencies } from './presentation/index.js';

// Application handlers вЂ” apps/api instantiates and passes to router factories
export { CreateTenantHandler } from './application/commands/create-tenant/CreateTenantHandler.js';
export { GetTenantHandler } from './application/queries/get-tenant/GetTenantHandler.js';
export { ListTenantsHandler } from './application/queries/list-tenants/ListTenantsHandler.js';
export { ListMembersHandler } from './application/queries/list-members/ListMembersHandler.js';

// Application views (DTOs)
export type { TenantView } from './application/queries/TenantView.js';
export type { MemberView } from './application/queries/MemberView.js';

// Application ports вЂ” for cross-module wiring
export type { OutboxPort } from './application/ports/OutboxPort.js';
export type { EventBusPort } from './application/ports/EventBusPort.js';
export type {
  TenantUnitOfWork,
  TenantTransactionContext,
} from './application/ports/TenantUnitOfWork.js';

// Domain вЂ” public aggregates, value objects, enums, events
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
export { TenantCreatedEvent } from './domain/events/TenantCreatedEvent.js';
export { TenantUpdatedEvent } from './domain/events/TenantUpdatedEvent.js';
export { TenantSuspendedEvent } from './domain/events/TenantSuspendedEvent.js';
export { TenantDeletedEvent } from './domain/events/TenantDeletedEvent.js';
export { MemberAddedEvent } from './domain/events/MemberAddedEvent.js';
export type { TenantRepository } from './domain/repositories/TenantRepository.js';
export type { MemberRepository } from './domain/repositories/MemberRepository.js';

// Repository implementations вЂ” for DI in apps/api
export { DrizzleTenantRepository } from './infrastructure/repositories/DrizzleTenantRepository.js';
export { DrizzleMemberRepository } from './infrastructure/repositories/DrizzleMemberRepository.js';
export { DrizzleOutboxRepository } from './infrastructure/repositories/DrizzleOutboxRepository.js';
export { InMemoryTenantRepository } from './infrastructure/repositories/InMemoryTenantRepository.js';
export { InMemoryMemberRepository } from './infrastructure/repositories/InMemoryMemberRepository.js';
export { DrizzleTenantUnitOfWork } from './infrastructure/database/DrizzleTenantUnitOfWork.js';

// DB schema tables вЂ” for Drizzle migrations
export { tenants, members, outboxEvents } from './infrastructure/database/schema/index.js';