import type { TenantStatus } from '../../domain/index.js';

/**
 * Read-model DTO for a Tenant.
 * Returned by queries; deliberately decoupled from the domain aggregate.
 */
export interface TenantView {
  id: string;
  name: string;
  slug: string;
  status: TenantStatus;
  settings: {
    locale: string;
    timezone: string;
    currency: string;
    logoUrl: string | null;
    primaryColor: string | null;
  };
  ownerUserId: string;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}
