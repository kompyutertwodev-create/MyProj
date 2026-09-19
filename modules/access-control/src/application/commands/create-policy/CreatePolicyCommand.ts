import type { AttributeCondition } from '../../../domain/policy/AttributeCondition.js';
import type { PolicyEffect } from '../../../domain/policy/PolicyEffect.js';

/** Input for {@link CreatePolicyHandler}. */
export interface CreatePolicyCommand {
  name: string;
  description?: string;
  effect: PolicyEffect;
  /** Matchers: "*", "role:admin", "user:uuid", "tenant:uuid". */
  subjects: string[];
  /** Glob patterns: "content:*", "catalog:movie:read". */
  resources: string[];
  /** Action patterns: "read", "write", "*". */
  actions: string[];
  conditions?: AttributeCondition[];
  /** Lower number = evaluated first. Default 100. */
  priority?: number;
  isActive?: boolean;
  /** Actor creating the policy (for audit). */
  createdBy: string;
  tenantId?: string | null;
}