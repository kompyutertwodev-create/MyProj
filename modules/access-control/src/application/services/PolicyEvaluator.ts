import type { PolicyRepository } from '../../domain/policy/PolicyRepository.js';
import type { RoleRepository } from '../../domain/role/RoleRepository.js';
import { PolicyEffect } from '../../domain/policy/PolicyEffect.js';
import {
  flattenContext,
  type PolicyEvaluationContext,
} from '../../domain/policy/PolicyEvaluationContext.js';

/**
 * Minimum information needed to evaluate a policy.
 *
 * Deliberately *not* the iam `User` aggregate вЂ” `access-control` must not
 * depend on the identity module. Callers (typically `CheckPermissionHandler`)
 * resolve the caller's roles and attributes and pass them in.
 */
export interface SubjectDescriptor {
  userId: string;
  /** Role names held by the subject (active only). */
  roleNames: string[];
  tenantId: string | null;
  /** Optional free-form attributes for ABAC conditions. */
  attributes?: Record<string, unknown>;
}

/** Input to {@link PolicyEvaluator.evaluate}. */
export interface EvaluateRequest {
  subject: SubjectDescriptor;
  /** Resource identifier, e.g. "tenant" or "catalog:movie". */
  resource: string;
  /** Action identifier, e.g. "create" or "read". */
  action: string;
  /** Extra attributes for resource/environment conditions. */
  resourceAttributes?: Record<string, unknown>;
  environmentAttributes?: Record<string, unknown>;
}

/** Why a decision was made вЂ” useful for audit and debugging. */
export type DecisionReason =
  | 'abac_deny'
  | 'abac_allow'
  | 'rbac_allow'
  | 'default_deny';

/** Full result of an authorization query. */
export interface EvaluationResult {
  allowed: boolean;
  reason: DecisionReason;
  /** Ids of policies that matched вЂ” helpful for tracing. */
  matchedPolicyIds: string[];
  /** Role names that contributed to the RBAC decision. */
  matchedRoleNames: string[];
}

/**
 * Combined RBAC + ABAC evaluator.
 *
 * Evaluation order (deny-overrides strategy):
 *
 *   1. Load every active policy that mentions the subject's descriptors
 *      ("*", "user:<id>", "role:<name>", "tenant:<id>").
 *   2. Sort by priority ascending (lower number evaluated first).
 *   3. If ANY matching policy returns Deny в†’ DENY immediately (win).
 *   4. If ANY matching policy returns Allow в†’ ALLOW.
 *   5. Otherwise, fall back to RBAC: if the subject's roles grant the
 *      requested `<resource>:<action>` permission в†’ ALLOW.
 *   6. If nothing matched в†’ DENY (default-deny).
 *
 * Step 5 is the crucial difference from the legacy `PolicyService`: roles
 * are resolved by the caller, not by reaching into the iam module.
 */
export class PolicyEvaluator {
  constructor(
    private readonly policyRepo: PolicyRepository,
    private readonly roleRepo: RoleRepository,
  ) {}

  async evaluate(request: EvaluateRequest): Promise<EvaluationResult> {
    const { subject, resource, action } = request;

    const subjectDescriptors = [
      `user:${subject.userId}`,
      ...subject.roleNames.map((r) => `role:${r}`),
    ];
    if (subject.tenantId) {
      subjectDescriptors.push(`tenant:${subject.tenantId}`);
    }

    const ctx: PolicyEvaluationContext = {
      subject: {
        id: subject.userId,
        roles: subject.roleNames,
        tenantId: subject.tenantId ?? undefined,
        ...(subject.attributes ?? {}),
      },
      resource: {
        type: resource,
        ...(request.resourceAttributes ?? {}),
      },
      environment: request.environmentAttributes,
    };
    const flat = flattenContext(ctx);

    const policies = await this.policyRepo.findForSubjects([
      '*',
      ...subjectDescriptors,
    ]);
    policies.sort((a, b) => a.priority - b.priority);

    const matchedPolicyIds: string[] = [];
    let hasAbacAllow = false;

    for (const policy of policies) {
      const effect = policy.evaluate(
        subjectDescriptors,
        resource,
        action,
        flat,
      );
      if (effect === PolicyEffect.Deny) {
        matchedPolicyIds.push(policy.id.value);
        return {
          allowed: false,
          reason: 'abac_deny',
          matchedPolicyIds,
          matchedRoleNames: [],
        };
      }
      if (effect === PolicyEffect.Allow) {
        matchedPolicyIds.push(policy.id.value);
        hasAbacAllow = true;
      }
    }

    if (hasAbacAllow) {
      return {
        allowed: true,
        reason: 'abac_allow',
        matchedPolicyIds,
        matchedRoleNames: [],
      };
    }

    // RBAC fallback вЂ” resolve permissions through the subject's roles.
    const permission = `${resource}:${action}`;
    const matchedRoleNames: string[] = [];
    for (const roleName of subject.roleNames) {
      const role = await this.roleRepo.findByName(roleName);
      if (!role) continue;
      if (role.hasPermission(permission)) {
        matchedRoleNames.push(roleName);
      }
    }

    if (matchedRoleNames.length > 0) {
      return {
        allowed: true,
        reason: 'rbac_allow',
        matchedPolicyIds,
        matchedRoleNames,
      };
    }

    return {
      allowed: false,
      reason: 'default_deny',
      matchedPolicyIds,
      matchedRoleNames: [],
    };
  }
}