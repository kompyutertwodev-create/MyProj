import type { PolicyRepository } from '../../domain/policy/PolicyRepository.js';
import { PolicyEffect } from '../../domain/policy/PolicyEffect.js';
import { flattenContext } from '../../domain/policy/PolicyEvaluationContext.js';
import type { PolicyEvaluationContext } from '../../domain/policy/PolicyEvaluationContext.js';
import type { UserRepository } from '../../domain/repositories/UserRepository.js';
import { UserId } from '../../domain/UserId.js';

/**
 * ABAC + RBAC combined authorization service.
 *
 * Evaluation order (deny-overrides strategy):
 *   1. Load all policies matching the subject descriptors.
 *   2. Sort by priority (ascending — lower number evaluated first).
 *   3. If ANY matching policy has effect=Deny  → DENY immediately.
 *   4. If AT LEAST ONE matching policy has effect=Allow → ALLOW.
 *   5. If no policies match at all → DENY (default-deny).
 *
 * Subject descriptors built from userId + role names, e.g.:
 *   ["user:abc123", "role:admin", "role:moderator"]
 */
export class PolicyService {
  constructor(
    private readonly policyRepo: PolicyRepository,
    private readonly userRepo: UserRepository
  ) {}

  async canAccess(
    userId: string,
    resource: string,
    action: string,
    extraContext: Partial<PolicyEvaluationContext> = {}
  ): Promise<boolean> {
    // Build subject descriptors
    const user = await this.userRepo.findById(userId);
    if (!user) return false;

    const roles = user.roles.map((r) => r.name.value);
    const rbacAllowed = user.hasPermission(`${resource}:${action}`);
    const subjectDescriptors = [`user:${userId}`, ...roles.map((r) => `role:${r}`)];

    const ctx: PolicyEvaluationContext = {
      subject: {
        id: userId,
        roles,
        ...extraContext.subject,
      },
      resource: {
        type: resource,
        ...extraContext.resource,
      },
      environment: extraContext.environment,
    };

    const flat = flattenContext(ctx);
    const policies = await this.policyRepo.findForSubjects(['*', ...subjectDescriptors]);

    // Sort by priority ascending
    policies.sort((a, b) => a.priority - b.priority);

    let hasAllow = false;
    for (const policy of policies) {
      const result = policy.evaluate(subjectDescriptors, resource, action, flat);
      if (result === PolicyEffect.Deny) return false; // Deny always wins
      if (result === PolicyEffect.Allow) hasAllow = true;
    }

    // RBAC permissions provide the baseline allow. ABAC policies can grant
    // additional access, and any matching deny above still overrides both.
    return hasAllow || rbacAllowed;
  }

  /**
   * RBAC shortcut — check if user has a specific role (no policy engine needed).
   */
  async hasRole(userId: string, roleName: string): Promise<boolean> {
    const user = await this.userRepo.findById(userId);
    if (!user) return false;
    return user.roles.some((r) => r.name.value === roleName);
  }

  /**
   * RBAC shortcut — check if user has a specific permission through any role.
   */
  async hasPermission(userId: string, permissionName: string): Promise<boolean> {
    const user = await this.userRepo.findById(userId);
    if (!user) return false;
    return user.roles.some((role) => role.hasPermission(permissionName));
  }
}
