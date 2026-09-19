import { Policy } from '../../domain/policy/Policy.js';
import { PolicyId } from '../../domain/policy/PolicyId.js';
import { PolicyEffect } from '../../domain/policy/PolicyEffect.js';
import type { AttributeCondition } from '../../domain/policy/AttributeCondition.js';
import type { AcPolicyRow } from '../database/schema/index.js';

/**
 * PolicyMapper вЂ” converts between the Policy aggregate and `ac_policies`.
 *
 * JSONB columns (`subjects`, `resources`, `actions`, `conditions`) are
 * copied verbatim вЂ” the aggregate re-validates them in `reconstruct()` so a
 * malformed payload is caught at hydration time, not at write time.
 */
export class PolicyMapper {
  static toDomain(row: AcPolicyRow): Policy {
    return Policy.reconstruct({
      id: new PolicyId(row.id),
      name: row.name,
      description: row.description,
      effect: row.effect as PolicyEffect,
      subjects: [...row.subjects],
      resources: [...row.resources],
      actions: [...row.actions],
      conditions: row.conditions as AttributeCondition[],
      priority: row.priority,
      isActive: row.isActive,
      isDeleted: row.isDeleted,
      tenantId: row.tenantId,
      createdBy: row.createdBy,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      version: row.version,
    });
  }

  static toPersistence(policy: Policy): AcPolicyRow {
    return {
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
      createdAt: policy.createdAt,
      updatedAt: policy.updatedAt,
      version: policy.version,
    };
  }
}