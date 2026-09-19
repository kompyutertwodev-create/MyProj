import {
  CreateTenantHandler,
  DrizzleMemberRepository,
  DrizzleTenantRepository,
  DrizzleOutboxRepository,
  DrizzleTenantUnitOfWork,
  GetTenantHandler,
  ListMembersHandler,
  ListTenantsHandler,
} from '@workspace/tenant';
import {
  createPlatformEventBus,
  OutboxEventBus,
  OutboxEventDispatcher,
  type PostgresDatabase,
} from '@workspace/platform';
import { withAmbientContext } from '@workspace/kernel';
import { getEventContext } from '../context/index.js';

export interface TenantContainer {
  tenants: DrizzleTenantRepository;
  members: DrizzleMemberRepository;
  outbox: DrizzleOutboxRepository;
  unitOfWork: DrizzleTenantUnitOfWork;
  createTenant: CreateTenantHandler;
  getTenant: GetTenantHandler;
  listTenants: ListTenantsHandler;
  listMembers: ListMembersHandler;
  events: OutboxEventBus;
  outboxDispatcher: OutboxEventDispatcher;
}

export interface TenantContainerOptions {
  database: PostgresDatabase;
  /**
   * Shared transport. The composition root passes the same transport that
   * IAM uses so audit / notification consumers see tenant events.
   */
  transport?: ReturnType<typeof createPlatformEventBus>;
  startBackgroundWorkers?: boolean;
}

/**
 * Composition root for the tenant module.
 *
 * Wires Drizzle repositories, the shared outbox dispatcher and the unit
 * of work. The event bus is wrapped with `withAmbientContext` so handlers
 * automatically pick up correlation / actor metadata.
 */
export function createTenantContainer(options: TenantContainerOptions): TenantContainer {
  const { db } = options.database;

  const tenants = new DrizzleTenantRepository(db);
  const members = new DrizzleMemberRepository(db);
  const outbox = new DrizzleOutboxRepository(db);
  const unitOfWork = new DrizzleTenantUnitOfWork(db);

  const transport = options.transport ?? createPlatformEventBus();
  const events = withAmbientContext(
    new OutboxEventBus(outbox, transport),
    getEventContext,
  );
  const outboxDispatcher = new OutboxEventDispatcher(outbox, transport);
  if (options.startBackgroundWorkers !== false) {
    outboxDispatcher.start();
  }

  const createTenant = new CreateTenantHandler(tenants, members, events, unitOfWork);
  const getTenant = new GetTenantHandler(tenants);
  const listTenants = new ListTenantsHandler(tenants);
  const listMembers = new ListMembersHandler(members);

  return {
    tenants,
    members,
    outbox,
    unitOfWork,
    createTenant,
    getTenant,
    listTenants,
    listMembers,
    events,
    outboxDispatcher,
  };
}