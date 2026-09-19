import type { UserRepository } from '../../../domain/repositories/UserRepository.js';
import type { GetUserQuery } from './GetUserQuery.js';
import type { UserView } from '../UserView.js';

/**
 * Read a User by id and project it to a flat view.
 *
 * Roles / permissions are intentionally absent: those are owned by the
 * access-control module and queried through the AuthorizationPort when the
 * caller actually needs them.
 */
export class GetUserHandler {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(query: GetUserQuery): Promise<UserView | null> {
    const user = await this.userRepository.findById(query.userId);
    if (!user) return null;
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