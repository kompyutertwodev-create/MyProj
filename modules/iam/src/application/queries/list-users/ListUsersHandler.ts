import type { UserRepository } from '../../../domain/repositories/UserRepository.js';
import type { PaginatedResult } from '@workspace/kernel';
import type { ListUsersQuery } from './ListUsersQuery.js';
import type { UserView } from '../UserView.js';

export class ListUsersHandler {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(query: ListUsersQuery): Promise<PaginatedResult<UserView>> {
    const result = await this.userRepository.findAll(
      { search: query.search, status: query.status, roleFilter: query.roleFilter },
      { page: Math.max(1, query.page), pageSize: Math.min(100, Math.max(1, query.pageSize)) }
    );
    return {
      ...result,
      items: result.items.map((user) => ({
        id: user.id.value,
        email: user.email.value,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        status: user.status,
        roles: user.roles.map((r) => r.name.value),
        permissions: [...new Set(user.roles.flatMap((r) => r.permissions.map((p) => p.name)))],
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      })),
    };
  }
}
