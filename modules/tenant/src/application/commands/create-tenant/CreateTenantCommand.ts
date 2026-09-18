export interface CreateTenantCommand {
  name: string;
  slug: string;
  ownerUserId: string;
  settings?: {
    locale?: string;
    timezone?: string;
    currency?: string;
    logoUrl?: string | null;
    primaryColor?: string | null;
  };
}
