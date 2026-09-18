import type { Tenant } from '../Tenant.js';

export interface TenantRepository {
  findById(id: string): Promise<Tenant | null>;
  findBySlug(slug: string): Promise<Tenant | null>;
  existsBySlug(slug: string): Promise<boolean>;
  findAll(options?: { limit?: number; offset?: number }): Promise<Tenant[]>;
  countAll(): Promise<number>;
  save(tenant: Tenant): Promise<void>;
  delete(id: string): Promise<void>;
}
