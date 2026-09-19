import { err, ok, type Result } from '@workspace/kernel';
import { PolicyId } from '../../../domain/policy/PolicyId.js';
import type { AttributeCondition } from '../../../domain/policy/AttributeCondition.js';
import type { AccessControlUnitOfWork } from '../../ports/AccessControlUnitOfWork.js';
import {
  ApplicationError,
  NotFoundApplicationError,
  ValidationApplicationError,
} from '../../ports/ApplicationError.js';
import type { GetPolicyQuery } from './GetPolicyQuery.js';

/** Flat read model for a Policy. */
export interface PolicyView {
  id: string;
  name: string;
  description: string;
  effect: string;
  subjects: string[];
  resources: string[];
  actions: string[];
  conditions: AttributeCondition[];
  priority: number;
  isActive: boolean;
  isDeleted: boolean;
  tenantId: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}

/**
 * Load a Policy by id and project it into a flat DTO.
 *
 * The DTO mirrors the persistence shape rather than the aggregate, so
 * consumers cannot trigger lazy-loads or violate invariants.
 */
export class GetPolicyHandler {
  constructor(private readonly uow: AccessControlUnitOfWork) {}

  async execute(
    query: GetPolicyQuery,
  ): Promise<Result<PolicyView, ApplicationError>> {
    const policyId = (query.policyId ?? '').trim();
    if (policyId.length === 0) {
      return err(
        new ValidationApplicationError('policyId is required', 'POLICY_ID_REQUIRED'),
      );
    }

    const policy = await this.uow.policies.findById(new PolicyId(policyId));
    if (!policy) {
      return err(
        new NotFoundApplicationError(
          `Policy "${policyId}" was not found`,
          'POLICY_NOT_FOUND',
        ),
      );
    }

    return ok({
      id: policy.id.value,
      name: policy.name,
      description: policy.description,
      effect: policy.effect,
      subjects: [...policy.subjects],
      resources: [...policy.resources],
      actions: [...policy.actions],
      conditions: [...policy.conditions],
      priority: policy.priority,
      isActive: policy.isActive,
      isDeleted: policy.isDeleted,
      tenantId: policy.tenantId,
      createdBy: policy.createdBy,
      createdAt: policy.createdAt.toISOString(),
      updatedAt: policy.updatedAt.toISOString(),
      version: policy.version,
    });
  }
}