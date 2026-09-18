import { DomainError, Result, ValueObject, err, ok } from '@workspace/kernel';

interface TenantSlugProps {
  value: string;
}

/**
 * Value Object: URL-friendly identifier of a Tenant.
 *
 * Rules:
 * - 3 to 63 characters
 * - lowercase letters, digits, and hyphens only
 * - must start and end with a letter or digit
 * - cannot contain consecutive hyphens
 *
 * Examples: "acme-corp", "my-company-2024", "shop1"
 */
export class TenantSlug extends ValueObject<TenantSlugProps> {
  private static readonly PATTERN = /^[a-z0-9](?:[a-z0-9]|-(?=[a-z0-9])){1,61}[a-z0-9]$/;

  private constructor(props: TenantSlugProps) {
    super(props);
  }

  get value(): string {
    return this.props.value;
  }

  static create(value: string): Result<TenantSlug, DomainError> {
    const normalized = value.trim().toLowerCase();

    if (normalized.length < 3) {
      return err(
        new DomainError('TENANT_SLUG_TOO_SHORT', 'Tenant slug must be at least 3 characters')
      );
    }

    if (normalized.length > 63) {
      return err(
        new DomainError('TENANT_SLUG_TOO_LONG', 'Tenant slug cannot exceed 63 characters')
      );
    }

    if (!TenantSlug.PATTERN.test(normalized)) {
      return err(
        new DomainError(
          'TENANT_SLUG_INVALID_FORMAT',
          'Tenant slug must contain only lowercase letters, digits, and hyphens, and must start and end with a letter or digit'
        )
      );
    }

    return ok(new TenantSlug({ value: normalized }));
  }

  toString(): string {
    return this.props.value;
  }
}
