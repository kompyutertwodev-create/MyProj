import { err, ok, type Result } from '@workspace/kernel';
import type { RoleAssignmentRepository } from '../../../domain/assignment/RoleAssignmentRepository.js';
import type { PolicyEvaluator } from '../../services/PolicyEvaluator.js';
import {
  ApplicationError,
  ValidationApplicationError,
} from '../../ports/ApplicationError.js';
import type { CheckPermissionQuery } from './CheckPermissionQuery.js';

/**
 * Flat response for the authorization hot path.
 *
 * `reason` mirrors {@link DecisionReason} from the evaluator so HTTP
 * callers can log "why" without importing the evaluator type.
 */
export interface CheckPermissionResult {
  allowed: boolean;
  reason: string;
  matchedPolicyIds: string[];
  matchedRoleNames: string[];
}

/**
 * Answer "can this user do <action> on <resource>?".
 *
 * Responsibilities:
 *   1. Load the user's active role assignments.
 *   2. Translate them into a {@link SubjectDescriptor} (role names only).
 *   3. Delegate the actual decision to {@link PolicyEvaluator}.
 *
 * Kept deliberately thin: no policy logic lives here.
 */
export class CheckPermissionHandler {
  constructor(
    private readonly roleAssignments: RoleAssignmentRepository,
    private readonly evaluator: PolicyEvaluator,
  ) {}

  async execute(
    query: CheckPermissionQuery,
  ): Promise<Result<CheckPermissionResult, ApplicationError>> {
    const userId = (query.userId ?? '').trim();
    if (userId.length === 0) {
      return err(
        new ValidationApplicationError('userId is required', 'USER_ID_REQUIRED'),
      );
    }

    const resource = (query.resource ?? '').trim();
    if (resource.length === 0) {
      return err(
        new ValidationApplicationError('resource is required', 'RESOURCE_REQUIRED'),
      );
    }

    const action = (query.action ?? '').trim();
    if (action.length === 0) {
      return err(
        new ValidationApplicationError('action is required', 'ACTION_REQUIRED'),
      );
    }

    const assignments = await this.roleAssignments.findByUserId(userId, {
      includeInactive: false,
    });

    const active = assignments.filter((a) => a.isActive());
    const roleNames = [...new Set(active.map((a) => a.roleName))];
    const tenantId = active.find((a) => a.tenantId !== null)?.tenantId ?? null;

    const evaluation = await this.evaluator.evaluate({
      subject: {
        userId,
        roleNames,
        tenantId,
      },
      resource,
      action,
      resourceAttributes: query.resourceAttributes,
      environmentAttributes: query.environmentAttributes,
    });

    return ok({
      allowed: evaluation.allowed,
      reason: evaluation.reason,
      matchedPolicyIds: evaluation.matchedPolicyIds,
      matchedRoleNames: evaluation.matchedRoleNames,
    });
  }
}