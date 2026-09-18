import { ValueObject, DomainError, Result, ok, err } from '@workspace/kernel';

interface RoleNameProps {
  value: string;
}

export class RoleName extends ValueObject<RoleNameProps> {
  static readonly ADMIN = 'admin';
  static readonly USER = 'user';
  static readonly MODERATOR = 'moderator';
  static readonly GUEST = 'guest';

  private constructor(props: RoleNameProps) {
    super(props);
  }

  get value(): string {
    return this.props.value;
  }

  static create(value: string): Result<RoleName, DomainError> {
    if (!value || value.trim().length === 0) {
      return err(new DomainError('ROLE_NAME_EMPTY', 'Role name cannot be empty'));
    }
    const normalized = value.trim().toLowerCase();
    return ok(new RoleName({ value: normalized }));
  }

  toString(): string {
    return this.props.value;
  }
}
