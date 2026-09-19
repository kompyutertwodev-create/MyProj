import {
  Tenant,
  TenantName,
  TenantSettings,
  TenantSlug,
  TenantStatus,
  type Member,
} from '../../domain/index.js';
import type { TenantSettingsRow } from '../database/schema/tenants.table.js';

/**
 * Persistence representation of a Tenant.
 *
 * `deletedAt` and `version` are part of the row so soft delete and
 * optimistic concurrency work end-to-end.
 */
export interface TenantPersistence {
  id: string;
  name: string;
  slug: string;
  status: TenantStatus;
  settings: TenantSettingsRow;
  ownerUserId: string;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

export class TenantMapper {
  static toDomain(row: TenantPersistence, members: Member[]): Tenant {
    const name = TenantName.create(row.name);
    if (name.isErr()) throw name.error;

    const slug = TenantSlug.create(row.slug);
    if (slug.isErr()) throw slug.error;

    const settings = TenantSettings.create(row.settings);

    return Tenant.reconstruct({
      id: row.id,
      name: name.value,
      slug: slug.value,
      status: row.status,
      settings,
      members,
      ownerUserId: row.ownerUserId,
      deletedAt: row.deletedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      version: row.version,
    });
  }

  static toPersistence(tenant: Tenant): TenantPersistence {
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
      deletedAt: tenant.deletedAt,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
      version: tenant.version,
    };
  }
}