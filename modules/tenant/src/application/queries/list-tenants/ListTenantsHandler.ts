import { paginate, type PaginatedResult } from '@workspace/kernel';
import type { TenantRepository } from '../../../domain/repositories/TenantRepository.js';
import type { ListTenantsQuery } from './ListTenantsQuery.js';
import type { TenantView } from '../TenantView.js';

export class ListTenantsHandler {
  constructor(private readonly tenantRepository: TenantRepository) {}

  async execute(query: ListTenantsQuery): Promise<PaginatedResult<TenantView>> {
    const page = Math.max(1, query.page);
    const pageSize = Math.min(100, Math.max(1, query.pageSize));
    const offset = (page - 1) * pageSize;

    const [items, total] = await Promise.all([
      this.tenantRepository.findAll({ limit: pageSize, offset }),
      this.tenantRepository.countAll(),
    ]);

    const views: TenantView[] = items.map((tenant) => ({
      id: tenant.id.value,
      name: tenant.name.value,
      slug: tenant.slug.value,
      status: tenant.status,
      settings: {
        locale: tenant.settings.locale,
        timezone: tenant.settings.timezone,
        currency: tenant.settings.currency,
        logoUrl: tenant.settings.logoUrl,
        primaryColor: tenant.settings.primaryColor,
      },
      ownerUserId: tenant.ownerUserId,
      memberCount: tenant.members.length,
      createdAt: tenant.createdAt.toISOString(),
      updatedAt: tenant.updatedAt.toISOString(),
    }));

    return paginate(views, total, { page, pageSize });
  }
}
