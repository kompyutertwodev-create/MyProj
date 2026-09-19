import type { Repository } from '@workspace/kernel';
import type { Role } from './Role.js';
import type { RoleId } from './RoleId.js';

/**
 * Repository contract for the {@link Role} aggregate.
 *
 * Lives in the domain layer so the application layer can depend on the
 * abstraction; the concrete Drizzle/InMemory implementation lives under
 * infrastructure/repositories.
 */
export interface RoleRepository extends Repository<Role, RoleId> {
  /** Look up a role by its normalized, unique name (usually within a tenant). */
  findByName(name: string): Promise<Role | null>;

  /** All roles, ordered by name ascending. */
  findAll(): Promise<Role[]>;

  /** Roles within a given tenant (null = global / system roles). */
  findByTenant(tenantId: string | null): Promise<Role[]>;

  /** True if the given name is already taken (optionally excluding an id). */
  existsByName(name: string, excludeId?: string): Promise<boolean>;
}