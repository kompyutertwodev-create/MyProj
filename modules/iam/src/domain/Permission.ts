import { ValueObject, DomainError, Result, ok, err } from '@workspace/kernel';

interface PermissionProps {
  name: string;
  description: string;
}

const PERMISSION_REGEX = /^[a-z_]+:[a-z_]+$/;

export class Permission extends ValueObject<PermissionProps> {
  private constructor(props: PermissionProps) {
    super(props);
  }

  get name(): string {
    return this.props.name;
  }

  get description(): string {
    return this.props.description;
  }

  static create(name: string, description: string): Result<Permission, DomainError> {
    if (!name || name.trim().length === 0) {
      return err(new DomainError('PERMISSION_NAME_EMPTY', 'Permission name cannot be empty'));
    }
    if (!PERMISSION_REGEX.test(name)) {
      return err(
        new DomainError(
          'PERMISSION_NAME_INVALID',
          `Permission name must be in format "resource:action", got: ${name}`
        )
      );
    }
    return ok(new Permission({ name, description: description ?? '' }));
  }

  toString(): string {
    return this.props.name;
  }
}
