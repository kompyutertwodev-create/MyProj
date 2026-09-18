import type { RoleRepository } from '../../domain/repositories/RoleRepository.js';
import type { Role } from '../../domain/Role.js';

export class InMemoryRoleRepository implements RoleRepository {
  private readonly roles = new Map<string, Role>();

  async findById(id: string): Promise<Role | null> {
    return this.roles.get(id) ?? null;
  }

  async findByName(name: string): Promise<Role | null> {
    return [...this.roles.values()].find((r) => r.name.value === name.toLowerCase()) ?? null;
  }

  async findAll(): Promise<Role[]> {
    return [...this.roles.values()];
  }

  async save(role: Role): Promise<void> {
    this.roles.set(role.id.value, role);
  }

  async delete(id: string): Promise<void> {
    this.roles.delete(id);
  }
}
