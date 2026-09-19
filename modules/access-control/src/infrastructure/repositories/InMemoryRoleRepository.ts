import type { Role } from '../../domain/role/Role.js';
import type { RoleId } from '../../domain/role/RoleId.js';
import type { RoleRepository } from '../../domain/role/RoleRepository.js';

/**
 * In-memory RoleRepository for unit tests.
 *
 * Stores aggregates by id and keeps them in insertion order so list
 * queries return deterministic results. All methods are synchronous
 * internally but exposed as Promise-returning to match the interface.
 */
export class InMemoryRoleRepository implements RoleRepository {
  private readonly roles = new Map<string, Role>();

  async findById(id: RoleId): Promise<Role | null> {
    return this.roles.get(id.value) ?? null;
  }

  async findByName(name: string): Promise<Role | null> {
    const normalized = name.trim().toLowerCase();
    for (const role of this.roles.values()) {
      if (role.name.value === normalized) return role;
    }
    return null;
  }

  async findAll(): Promise<Role[]> {
    return [...this.roles.values()].sort((a, b) =>
      a.name.value.localeCompare(b.name.value),
    );
  }

  async findByTenant(tenantId: string | null): Promise<Role[]> {
    return [...this.roles.values()]
      .filter((r) => r.tenantId === tenantId)
      .sort((a, b) => a.name.value.localeCompare(b.name.value));
  }

  async existsByName(name: string, excludeId?: string): Promise<boolean> {
    const normalized = name.trim().toLowerCase();
    for (const role of this.roles.values()) {
      if (excludeId !== undefined && role.id.value === excludeId) continue;
      if (role.name.value === normalized) return true;
    }
    return false;
  }

  async save(role: Role): Promise<void> {
    this.roles.set(role.id.value, role);
  }

  async delete(id: RoleId): Promise<void> {
    this.roles.delete(id.value);
  }

  /** Test helper вЂ” wipes the store between test cases. */
  clear(): void {
    this.roles.clear();
  }

  /** Test helper вЂ” number of stored aggregates. */
  get size(): number {
    return this.roles.size;
  }
}