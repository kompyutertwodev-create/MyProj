import type { AttributeCondition } from '../../../domain/policy/AttributeCondition.js';
import type { PolicyEffect } from '../../../domain/policy/PolicyEffect.js';

/**
 * Input for {@link UpdatePolicyHandler}.
 *
 * Fields left undefined are not touched вЂ” the handler only calls the
 * corresponding aggregate mutator for the properties the caller provided.
 * The handler deliberately re-uses the aggregate's own validators (e.g.
 * `Role.rename`) so the invariants cannot be bypassed here.
 */
export interface UpdatePolicyCommand {
  policyId: string;
  name?: string;
  description?: string;
  effect?: PolicyEffect;
  subjects?: string[];
  resources?: string[];
  actions?: string[];
  conditions?: AttributeCondition[];
  priority?: number;
  /** Actor performing the change (for audit). */
  updatedBy: string;
}