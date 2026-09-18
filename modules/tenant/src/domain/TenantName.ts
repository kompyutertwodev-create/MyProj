import { DomainError, Result, ValueObject, err, ok } from '@workspace/kernel';

interface TenantNameProps {
  value: string;
}

/**
 * Value Object: human-readable display name of a Tenant.
 *
 * Rules:
 * - 1 to 200 characters after trimming
 * - any Unicode characters allowed
 * - leading/trailing whitespace removed
 *
 * Examples: "Acme Corporation", "My Company", "ООО Ромашка"
 */
export class TenantName extends ValueObject<TenantNameProps> {
  private constructor(props: TenantNameProps) {
    super(props);
  }

  get value(): string {
    return this.props.value;
  }

  static create(value: string): Result<TenantName, DomainError> {
    const trimmed = value.trim();

    if (trimmed.length === 0) {
      return err(new DomainError('TENANT_NAME_EMPTY', 'Tenant name cannot be empty'));
    }

    if (trimmed.length > 200) {
      return err(
        new DomainError('TENANT_NAME_TOO_LONG', 'Tenant name cannot exceed 200 characters')
      );
    }

    return ok(new TenantName({ value: trimmed }));
  }

  toString(): string {
    return this.props.value;
  }
}
