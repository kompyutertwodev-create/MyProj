import {
  CreateTenantHandler,
  DrizzleMemberRepository,
  DrizzleTenantRepository,
  GetTenantHandler,
  ListMembersHandler,
  ListTenantsHandler,
} from '@workspace/tenant';
import type { PostgresDatabase, OutboxEventBus } from '@workspace/platform';

export interface TenantContainer {
  tenants: DrizzleTenantRepository;
  members: DrizzleMemberRepository;
  createTenant: CreateTenantHandler;
  getTenant: GetTenantHandler;
  listTenants: ListTenantsHandler;
  listMembers: ListMembersHandler;
}

export interface TenantContainerOptions {
  database: PostgresDatabase;
  events: OutboxEventBus;
}

export function createTenantContainer(options: TenantContainerOptions): TenantContainer {
  const { db } = options.database;

  const tenants = new DrizzleTenantRepository(db);
  const members = new DrizzleMemberRepository(db);

  const createTenant = new CreateTenantHandler(tenants, members, options.events);
  const getTenant = new GetTenantHandler(tenants);
  const listTenants = new ListTenantsHandler(tenants);
  const listMembers = new ListMembersHandler(members);

  return {
    tenants,
    members,
    createTenant,
    getTenant,
    listTenants,
    listMembers,
  };
}
