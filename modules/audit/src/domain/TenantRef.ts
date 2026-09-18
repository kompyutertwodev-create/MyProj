import { ValueObject } from '@workspace/kernel';

interface TenantRefProps {
  value: string | null;
}

/**
 * Value Object: optional reference to a tenant.
 * Audit logs may be global (no tenant) or scoped to a tenant.
 */
export class TenantRef extends ValueObject<TenantRefProps> {
  private constructor(props: TenantRefProps) {
    super(props);
  }

  get value(): string | null {
    return this.props.value;
  }

  static create(value: string | null | undefined): TenantRef {
    const normalized = value?.trim() || null;
    return new TenantRef({ value: normalized });
  }

  static none(): TenantRef {
    return new TenantRef({ value: null });
  }
}
