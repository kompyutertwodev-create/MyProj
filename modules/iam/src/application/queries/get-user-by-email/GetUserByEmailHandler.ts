import type { UserRepository } from '../../../domain/repositories/UserRepository.js';
import type { GetUserByEmailQuery } from './GetUserByEmailQuery.js';
import type { UserView } from '../UserView.js';

export class GetUserByEmailHandler {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(query: GetUserByEmailQuery): Promise<UserView | null> {
    const user = await this.userRepository.findByEmail(query.email);
    if (!user) return null;
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
