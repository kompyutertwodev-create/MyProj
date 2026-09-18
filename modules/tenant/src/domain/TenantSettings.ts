import { ValueObject } from '@workspace/kernel';

interface TenantSettingsProps {
  locale: string;
  timezone: string;
  currency: string;
  logoUrl: string | null;
  primaryColor: string | null;
}

export interface TenantSettingsInput {
  locale?: string;
  timezone?: string;
  currency?: string;
  logoUrl?: string | null;
  primaryColor?: string | null;
}

/**
 * Value Object: tenant-level configuration.
 *
 * Defaults are applied for any missing field, so a Tenant can always
 * be created with an empty settings object.
 */
export class TenantSettings extends ValueObject<TenantSettingsProps> {
  private static readonly DEFAULT_LOCALE = 'en';
  private static readonly DEFAULT_TIMEZONE = 'UTC';
  private static readonly DEFAULT_CURRENCY = 'USD';

  private constructor(props: TenantSettingsProps) {
    super(props);
  }

  get locale(): string {
    return this.props.locale;
  }

  get timezone(): string {
    return this.props.timezone;
  }

  get currency(): string {
    return this.props.currency;
  }

  get logoUrl(): string | null {
    return this.props.logoUrl;
  }

  get primaryColor(): string | null {
    return this.props.primaryColor;
  }

  static create(input: TenantSettingsInput = {}): TenantSettings {
    return new TenantSettings({
      locale: input.locale?.trim() || TenantSettings.DEFAULT_LOCALE,
      timezone: input.timezone?.trim() || TenantSettings.DEFAULT_TIMEZONE,
      currency: input.currency?.trim().toUpperCase() || TenantSettings.DEFAULT_CURRENCY,
      logoUrl: input.logoUrl ?? null,
      primaryColor: input.primaryColor ?? null,
    });
  }

  withLocale(locale: string): TenantSettings {
    return TenantSettings.create({ ...this.props, locale });
  }

  withTimezone(timezone: string): TenantSettings {
    return TenantSettings.create({ ...this.props, timezone });
  }

  withCurrency(currency: string): TenantSettings {
    return TenantSettings.create({ ...this.props, currency });
  }
}
