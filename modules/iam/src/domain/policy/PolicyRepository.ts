import type { Policy } from './Policy.js';

export interface PolicyRepository {
  findById(id: string): Promise<Policy | null>;
  findAll(onlyActive?: boolean): Promise<Policy[]>;
  findForSubjects(subjects: string[]): Promise<Policy[]>;
  save(policy: Policy): Promise<void>;
  delete(id: string): Promise<void>;
}
