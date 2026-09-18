import type { User } from '../../../domain/User.js';
import type { UserView } from '../../../application/queries/UserView.js';

/** Never expose password hashes, refresh tokens, or internal domain events. */
export class UserTransformer {
  static toView(user: User): UserView {
    return {
      id: user.id.value,
      email: user.email.value,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      status: user.status,
      roles: user.roles.map((r) => r.name.value),
      permissions: [...new Set(user.roles.flatMap((r) => r.permissions.map((p) => p.name)))],
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}
