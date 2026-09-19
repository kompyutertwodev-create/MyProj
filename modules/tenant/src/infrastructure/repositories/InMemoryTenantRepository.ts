import { err, ok, type PaginatedResult, type PaginationParams, type Result } from '@workspace/kernel';
import type { TenantRepository } from '../../domain/repositories/TenantRepository.js';
import type { Tenant } from '../../domain/Tenant.js';

/**
 * In-memory TenantRepository for unit tests.
 *
 * Soft-deleted rows are excluded from every read method, matching the
 * behaviour of the Drizzle adapter.
 */
export class InMemoryTenantRepository implements TenantRepository {
  private readonly tenants = new Map<string, Tenant>();

  async findById(id: string): Promise<Tenant | null> {
    const tenant = this.tenants.get(id);
    if (!tenant || tenant.isDeleted) return null;
    return tenant;
  }

  async findBySlug(slug: string): Promise<Tenant | null> {
    const normalized = slug.trim().toLowerCase();
    for (const tenant of this.tenants.values()) {
      if (tenant.isDeleted) continue;
      if (tenant.slug.value === normalized) return tenant;
    }
    return null;
  }

  async existsBySlug(slug: string): Promise<boolean> {
    return (await this.findBySlug(slug)) !== null;
  }

  async findAll(options?: { limit?: number; offset?: number }): Promise<Tenant[]> {
    const all = [...this.tenants.values()].filter((t) => !t.isDeleted);
    const limit = options?.limit ?? 50;
    const offset = options?.offset ?? 0;
    return all.slice(offset, offset + limit);
  }

  async countAll(): Promise<number> {
    return [...this.tenants.values()].filter((t) => !t.isDeleted).length;
  }

  async save(tenant: Tenant): Promise<void> {
    this.tenants.set(tenant.id.value, tenant);
  }

  async delete(id: string): Promise<void> {
    this.tenants.delete(id);
  }

  /** Test helper вЂ” wipes the store between test cases. */
  clear(): void {
    this.tenants.clear();
  }

  /** Test helper вЂ” number of stored aggregates. */
  get size(): number {
    return this.tenants.size;
  }
}