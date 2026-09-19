import type { Policy } from '../../domain/policy/Policy.js';
import type { PolicyId } from '../../domain/policy/PolicyId.js';
import type { PolicyRepository } from '../../domain/policy/PolicyRepository.js';

/**
 * In-memory PolicyRepository for unit tests.
 *
 * `findForSubjects` mirrors the Drizzle implementation's contract: it
 * returns every *active* policy that mentions at least one of the supplied
 * subject descriptors (or the wildcard "*"). The aggregate is then
 * responsible for resource/action/condition filtering.
 *
 * Soft-deleted policies are never returned.
 */
export class InMemoryPolicyRepository implements PolicyRepository {
  private readonly policies = new Map<string, Policy>();

  async findById(id: PolicyId): Promise<Policy | null> {
    const policy = this.policies.get(id.value);
    if (!policy) return null;
    if (policy.isDeleted) return null;
    return policy;
  }

  async findAll(onlyActive?: boolean): Promise<Policy[]> {
    const all = [...this.policies.values()].filter((p) => !p.isDeleted);
    const filtered =
      onlyActive === true ? all.filter((p) => p.isActive) : all;
    return filtered.sort((a, b) => a.priority - b.priority);
  }

  async findForSubjects(subjects: string[]): Promise<Policy[]> {
    const set = new Set(subjects);
    return [...this.policies.values()]
      .filter((p) => !p.isDeleted && p.isActive)
      .filter((p) => p.subjects.some((s) => set.has(s)))
      .sort((a, b) => a.priority - b.priority);
  }

  async existsByName(name: string, excludeId?: string): Promise<boolean> {
    const normalized = name.trim().toLowerCase();
    for (const policy of this.policies.values()) {
      if (policy.isDeleted) continue;
      if (excludeId !== undefined && policy.id.value === excludeId) continue;
      if (policy.name.toLowerCase() === normalized) return true;
    }
    return false;
  }

  async save(policy: Policy): Promise<void> {
    this.policies.set(policy.id.value, policy);
  }

  async delete(id: PolicyId): Promise<void> {
    this.policies.delete(id.value);
  }

  /** Test helper вЂ” wipes the store between test cases. */
  clear(): void {
    this.policies.clear();
  }

  /** Test helper вЂ” number of stored aggregates. */
  get size(): number {
    return this.policies.size;
  }
}