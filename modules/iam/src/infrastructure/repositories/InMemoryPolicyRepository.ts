import type { PolicyRepository } from '../../domain/policy/PolicyRepository.js';
import { Policy } from '../../domain/policy/Policy.js';

export class InMemoryPolicyRepository implements PolicyRepository {
  private readonly store = new Map<string, Policy>();

  async findById(id: string): Promise<Policy | null> {
    return this.store.get(id) ?? null;
  }

  async findAll(onlyActive = false): Promise<Policy[]> {
    const all = [...this.store.values()];
    return onlyActive ? all.filter((p) => p.isActive) : all;
  }

  async findForSubjects(subjects: string[]): Promise<Policy[]> {
    return [...this.store.values()].filter(
      (p) => p.isActive && p.subjects.some((s) => subjects.includes(s) || s === '*')
    );
  }

  async save(policy: Policy): Promise<void> {
    this.store.set(policy.id, policy);
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id);
  }
}
