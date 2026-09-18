import type { UserRepository } from '../../../domain/repositories/UserRepository.js';
import type { CheckPermissionQuery } from './CheckPermissionQuery.js';

export class CheckPermissionHandler {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(query: CheckPermissionQuery): Promise<boolean> {
    const user = await this.userRepository.findById(query.userId);
    return user?.hasPermission(query.permission) ?? false;
  }
}
