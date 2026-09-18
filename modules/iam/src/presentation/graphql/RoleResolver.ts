import type { RoleRepository } from '../../domain/repositories/RoleRepository.js';

export class RoleResolver {
  constructor(private readonly roleRepository: RoleRepository) {}

  resolveAll() {
    return this.roleRepository.findAll();
  }
}
