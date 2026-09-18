import type { Result } from '@workspace/kernel';
import { err, ok } from '@workspace/kernel';
import { Policy } from '../../../../domain/policy/Policy.js';
import type { PolicyRepository } from '../../../../domain/policy/PolicyRepository.js';
import type { ListPoliciesQuery } from './ListPoliciesQuery.js';
import type { ApplicationError } from '../../../ports/ApplicationError.js';
import { InternalApplicationError } from '../../../ports/ApplicationError.js';

export class ListPoliciesHandler {
  constructor(private readonly policyRepository: PolicyRepository) {}

  async execute(query: ListPoliciesQuery): Promise<
    Result<
      {
        items: Policy[];
        total: number;
        page: number;
        pageSize: number;
      },
      ApplicationError
    >
  > {
    try {
      // For now, use findAll. In future, implement pagination in repository
      const all = await this.policyRepository.findAll();

      // Apply filters in memory (temporary solution)
      let filtered = all;
      if (query.effect) {
        filtered = filtered.filter((p) => p.effect === query.effect);
      }
      if (query.isActive !== undefined) {
        filtered = filtered.filter((p) => p.isActive === query.isActive);
      }
      if (query.search) {
        const searchLower = query.search.toLowerCase();
        filtered = filtered.filter(
          (p) =>
            p.name.toLowerCase().includes(searchLower) ||
            p.description.toLowerCase().includes(searchLower)
        );
      }

      // Apply pagination in memory (temporary solution)
      const start = (query.page - 1) * query.pageSize;
      const end = start + query.pageSize;
      const items = filtered.slice(start, end);

      return ok({
        items,
        total: filtered.length,
        page: query.page,
        pageSize: query.pageSize,
      });
    } catch (error) {
      return err(
        new InternalApplicationError(
          error instanceof Error ? error.message : 'Failed to list policies'
        )
      );
    }
  }
}
