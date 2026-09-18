import { eq, sql, type SQL } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { TenantRepository } from '../../domain/repositories/TenantRepository.js';
import type { Tenant } from '../../domain/Tenant.js';
import { MemberMapper } from '../mappers/MemberMapper.js';
import { TenantMapper } from '../mappers/TenantMapper.js';
import { members } from '../database/schema/members.table.js';
import { tenants } from '../database/schema/tenants.table.js';
import type { MemberRole, MemberStatus, TenantStatus } from '../../domain/index.js';

export class DrizzleTenantRepository implements TenantRepository {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(private readonly db: NodePgDatabase<any>) {}

  async findById(id: string): Promise<Tenant | null> {
    return (await this.loadTenants(eq(tenants.id, id)))[0] ?? null;
  }

  async findBySlug(slug: string): Promise<Tenant | null> {
    return (await this.loadTenants(eq(tenants.slug, slug)))[0] ?? null;
  }

  async existsBySlug(slug: string): Promise<boolean> {
    const rows = await this.db
      .select({ id: tenants.id })
      .from(tenants)
      .where(eq(tenants.slug, slug))
      .limit(1);
    return rows.length > 0;
  }

  async findAll(options?: { limit?: number; offset?: number }): Promise<Tenant[]> {
    const limit = options?.limit ?? 50;
    const offset = options?.offset ?? 0;
    const rows = await this.db
      .select()
      .from(tenants)
      .orderBy(tenants.createdAt)
      .limit(limit)
      .offset(offset);

    return Promise.all(rows.map((row) => this.hydrate(row)));
  }

  async countAll(): Promise<number> {
    const rows = await this.db.select({ count: sql<number>`count(*)::int` }).from(tenants);
    return rows[0]?.count ?? 0;
  }

  async save(tenant: Tenant): Promise<void> {
    const row = TenantMapper.toPersistence(tenant);
    await this.db
      .insert(tenants)
      .values({
        id: row.id,
        name: row.name,
        slug: row.slug,
        status: row.status,
        settings: row.settings,
        ownerUserId: row.ownerUserId,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      })
      .onConflictDoUpdate({
        target: tenants.id,
        set: {
          name: row.name,
          slug: row.slug,
          status: row.status,
          settings: row.settings,
          ownerUserId: row.ownerUserId,
          updatedAt: row.updatedAt,
        },
      });
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(tenants).where(eq(tenants.id, id));
  }

  private async loadTenants(where?: SQL<unknown>): Promise<Tenant[]> {
    const rows = await this.db.select().from(tenants).where(where);
    return Promise.all(rows.map((row) => this.hydrate(row)));
  }

  private async hydrate(row: typeof tenants.$inferSelect): Promise<Tenant> {
    const memberRows = await this.db.select().from(members).where(eq(members.tenantId, row.id));

    const memberEntities = memberRows.map((m) =>
      MemberMapper.toDomain({
        id: m.id,
        tenantId: m.tenantId,
        userId: m.userId,
        role: m.role as MemberRole,
        status: m.status as MemberStatus,
        invitedBy: m.invitedBy,
        joinedAt: m.joinedAt,
        createdAt: m.createdAt,
        updatedAt: m.updatedAt,
      })
    );

    return TenantMapper.toDomain(
      {
        id: row.id,
        name: row.name,
        slug: row.slug,
        status: row.status as TenantStatus,
        settings: row.settings,
        ownerUserId: row.ownerUserId,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      memberEntities
    );
  }
}
