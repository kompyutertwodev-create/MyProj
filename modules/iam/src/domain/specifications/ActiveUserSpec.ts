import { CompositeSpecification } from '@workspace/kernel';
import type { User } from '../User.js';
import { UserStatus } from '../UserStatus.js';

export class ActiveUserSpec extends CompositeSpecification<User> {
  isSatisfiedBy(user: User): boolean {
    return user.status === UserStatus.Active;
  }
}
