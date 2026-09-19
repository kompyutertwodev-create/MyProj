import type { RoleAssignment } from '../../domain/assignment/RoleAssignment.js';
import type { RoleAssignmentId } from '../../domain/assignment/RoleAssignmentId.js';
import type { RoleAssignmentRepository } from '../../domain/assignment/RoleAssignmentRepository.js';

/** Options accepted by every list method. */
interface ListOptions {
  includeInactive?: boolean;
}

/**
 * In-memory RoleAssignmentRepository for unit tests.
 *
 * Active/expired predicates are evaluated lazily at query time so tests can
 * manipulate the clock and observe the correct filtering without having to
 * re-insert rows.
 */
export class InMemoryRoleAssignmentRepository
  implements RoleAssignmentRepository
{
  private readonly assignments = new Map<string, RoleAssignment>();

  async findById(id: RoleAssignmentId): Promise<RoleAssignment | null> {
    return this.assignments.get(id.value) ?? null;
  }

  async findByUserId(
    userId: string,
    options?: ListOptions,
  ): Promise<RoleAssignment[]> {
    return this.filterBy(
      (a) => a.userId === userId,
      options?.includeInactive ?? false,
    );
  }

  async findByRoleId(
    roleId: string,
    options?: ListOptions,
  ): Promise<RoleAssignment[]> {
    return this.filterBy(
      (a) => a.roleId === roleId,
      options?.includeInactive ?? false,
    );
  }

  async findByTenant(
    tenantId: string | null,
    options?: ListOptions,
  ): Promise<RoleAssignment[]> {
    return this.filterBy(
      (a) => a.tenantId === tenantId,
      options?.includeInactive ?? false,
    );
  }

  async hasActiveRole(userId: string, roleName: string): Promise<boolean> {
    const normalized = roleName.trim().toLowerCase();
    for (const a of this.assignments.values()) {
      if (a.userId !== userId) continue;
      if (a.roleName.toLowerCase() !== normalized) continue;
      if (a.isActive()) return true;
    }
    return false;
  }

  async hasActiveAssignment(userId: string, roleId: string): Promise<boolean> {
    for (const a of this.assignments.values()) {
      if (a.userId !== userId) continue;
      if (a.roleId !== roleId) continue;
      if (a.isActive()) return true;
    }
    return false;
  }

  async save(assignment: RoleAssignment): Promise<void> {
    this.assignments.set(assignment.id.value, assignment);
  }

  async delete(id: RoleAssignmentId): Promise<void> {
    this.assignments.delete(id.value);
  }

  /** Test helper вЂ” wipes the store between test cases. */
  clear(): void {
    this.assignments.clear();
  }

  /** Test helper вЂ” number of stored aggregates. */
  get size(): number {
    return this.assignments.size;
  }

  // в”Ђв”Ђ internal в”Ђв”Ђ

  private filterBy(
    predicate: (a: RoleAssignment) => boolean,
    includeInactive: boolean,
  ): RoleAssignment[] {
    const now = new Date();
    const result: RoleAssignment[] = [];
    for (const a of this.assignments.values()) {
      if (!predicate(a)) continue;
      if (!includeInactive && !a.isActive(now)) continue;
      result.push(a);
    }
    return result.sort(
      (a, b) => b.assignedAt.getTime() - a.assignedAt.getTime(),
    );
  }
}