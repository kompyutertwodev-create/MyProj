import type { TenantRepository } from '../../domain/repositories/TenantRepository.js';
import type { Tenant } from '../../domain/Tenant.js';

export class InMemoryTenantRepository implements TenantRepository {
  private readonly store = new Map<string, Tenant>();

  async findById(id: string): Promise<Tenant | null> {
    return this.store.get(id) ?? null;
  }

  async findBySlug(slug: string): Promise<Tenant | null> {
    for (const tenant of this.store.values()) {
      if (tenant.slug.value === slug) return tenant;
    }
    return null;
  }

  async existsBySlug(slug: string): Promise<boolean> {
    return (await this.findBySlug(slug)) !== null;
  }

  async findAll(options?: { limit?: number; offset?: number }): Promise<Tenant[]> {
    const all = [...this.store.values()];
    const offset = options?.offset ?? 0;
    const limit = options?.limit ?? all.length;
    return all.slice(offset, offset + limit);
  }

  async countAll(): Promise<number> {
    return this.store.size;
  }

  async save(tenant: Tenant): Promise<void> {
    this.store.set(tenant.id.value, tenant);
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id);
  }

  clear(): void {
    this.store.clear();
  }
}
