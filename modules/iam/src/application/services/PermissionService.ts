import type { UserRepository } from '../../domain/repositories/UserRepository.js';

/** Fast RBAC checks. Use PolicyService when resource attributes are required. */
export class PermissionService {
  constructor(private readonly userRepository: UserRepository) {}

  async canAccess(userId: string, resource: string, action: string): Promise<boolean> {
    const user = await this.userRepository.findById(userId);
    return user?.hasPermission(`${resource}:${action}`) ?? false;
  }

  async hasRole(userId: string, role: string): Promise<boolean> {
    const user = await this.userRepository.findById(userId);
    return user?.hasRole(role) ?? false;
  }
}
