import type { Repository } from '@workspace/kernel';
import type { Policy } from './Policy.js';
import type { PolicyId } from './PolicyId.js';

/**
 * Repository contract for the {@link Policy} aggregate.
 *
 * The `findForSubjects` query is the hot path of the ABAC engine: it must
 * return every active policy that could possibly match the caller's subject
 * descriptors (`"*"`, `"user:<id>"`, `"role:<name>"`, ...). Filtering by
 * resource/action is intentionally left to the aggregate so glob patterns
 * remain a domain concern.
 */
export interface PolicyRepository extends Repository<Policy, PolicyId> {
  /** All policies, optionally excluding soft-deleted rows. */
  findAll(onlyActive?: boolean): Promise<Policy[]>;

  /** Active, non-deleted policies whose subject matchers intersect the input. */
  findForSubjects(subjects: string[]): Promise<Policy[]>;

  /** True if the given policy name is already taken (optionally excluding an id). */
  existsByName(name: string, excludeId?: string): Promise<boolean>;
}