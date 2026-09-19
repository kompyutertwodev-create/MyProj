import type { User } from '../../../domain/User.js';
import type { UserView } from '../../../application/queries/UserView.js';

/**
 * UserTransformer вЂ” map a User aggregate to its public HTTP view.
 *
 * Never exposes password hashes, refresh tokens or internal domain state.
 * Roles and permissions are intentionally absent: they belong to the
 * access-control module and are looked up on demand.
 */
export class UserTransformer {
  static toView(user: User): UserView {
    return {
      id: user.id.value,
      email: user.email.value,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      status: user.status,
      tenantId: user.tenantId,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}