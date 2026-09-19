import { ok, type Result } from '@workspace/kernel';
import type { AttributeCondition } from '../../../domain/policy/AttributeCondition.js';
import type { AccessControlUnitOfWork } from '../../ports/AccessControlUnitOfWork.js';
import type { ApplicationError } from '../../ports/ApplicationError.js';
import type { ListPoliciesQuery } from './ListPoliciesQuery.js';

/** Flat read model for a policy row. */
export interface PolicyListItem {
  id: string;
  name: string;
  effect: string;
  priority: number;
  isActive: boolean;
  isDeleted: boolean;
  subjects: string[];
  resources: string[];
  actions: string[];
  conditions: AttributeCondition[];
  tenantId: string | null;
  createdBy: string;
  updatedAt: string;
}

/** Response for {@link ListPoliciesHandler}. */
export interface ListPoliciesResult {
  items: PolicyListItem[];
  total: number;
}

/**
 * List policies, filtered by active state, tenant and free-text search.
 *
 * Filtering by `onlyActive` is delegated to the repository
 * (`findAll(onlyActive)`) so the read path does not load rows it would
 * discard. Tenant + search filters are applied in-memory for simplicity;
 * move them to the SQL layer if the table grows.
 */
export class ListPoliciesHandler {
  constructor(private readonly uow: AccessControlUnitOfWork) {}

  async execute(
    query: ListPoliciesQuery,
  ): Promise<Result<ListPoliciesResult, ApplicationError>> {
    const onlyActive = query.onlyActive ?? true;

    const policies = await this.uow.policies.findAll(onlyActive);

    const tenantFilter =
      query.tenantId !== undefined ? query.tenantId : undefined;
    const search = (query.search ?? '').trim().toLowerCase();

    const filtered = policies.filter((p) => {
      if (tenantFilter !== undefined && p.tenantId !== tenantFilter) {
        return false;
      }
      if (search.length > 0 && !p.name.toLowerCase().includes(search)) {
        return false;
      }
      return true;
    });

    const items: PolicyListItem[] = filtered.map((p) => ({
      id: p.id.value,
      name: p.name,
      effect: p.effect,
      priority: p.priority,
      isActive: p.isActive,
      isDeleted: p.isDeleted,
      subjects: [...p.subjects],
      resources: [...p.resources],
      actions: [...p.actions],
      conditions: [...p.conditions],
      tenantId: p.tenantId,
      createdBy: p.createdBy,
      updatedAt: p.updatedAt.toISOString(),
    }));

    return ok({ items, total: items.length });
  }
}