import type { TenantRepository } from '../../../domain/repositories/TenantRepository.js';
import type { GetTenantQuery } from './GetTenantQuery.js';
import type { TenantView } from '../TenantView.js';

export class GetTenantHandler {
  constructor(private readonly tenantRepository: TenantRepository) {}

  async execute(query: GetTenantQuery): Promise<TenantView | null> {
    const tenant = await this.tenantRepository.findById(query.tenantId);
    if (!tenant) return null;

    return {
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
    };
  }
}
