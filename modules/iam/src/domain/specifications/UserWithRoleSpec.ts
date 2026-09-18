import { CompositeSpecification } from '@workspace/kernel';
import type { User } from '../User.js';

export class UserWithRoleSpec extends CompositeSpecification<User> {
  constructor(private readonly roleName: string) {
    super();
  }

  isSatisfiedBy(user: User): boolean {
    return user.roles.some((r) => r.name.value === this.roleName);
  }
}
