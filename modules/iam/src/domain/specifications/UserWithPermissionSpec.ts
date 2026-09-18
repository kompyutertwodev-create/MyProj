import { CompositeSpecification } from '@workspace/kernel';
import type { User } from '../User.js';

export class UserWithPermissionSpec extends CompositeSpecification<User> {
  constructor(private readonly permissionName: string) {
    super();
  }

  isSatisfiedBy(user: User): boolean {
    return user.roles.some((role) => role.hasPermission(this.permissionName));
  }
}
