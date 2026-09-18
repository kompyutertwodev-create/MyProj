import {
  CreateTenantHandler,
  DrizzleMemberRepository,
  DrizzleTenantRepository,
  GetTenantHandler,
  ListMembersHandler,
  ListTenantsHandler,
} from '@workspace/tenant';
import type { PostgresDatabase } from '@workspace/platform';
import type { OutboxEventBus } from '@workspace/platform';
import { runSqlMigrations } from '@workspace/platform';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

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
  runMigrations?: boolean;
}

export async function createTenantContainer(options: TenantContainerOptions): Promise<TenantContainer> {
  const { db } = options.database;

  // Run tenant migrations if not disabled
  if (options.runMigrations !== false) {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const migrationsDir = join(__dirname, '../../../../modules/tenant/src/infrastructure/database/migrations');
    await runSqlMigrations(options.database, migrationsDir);
  }

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
