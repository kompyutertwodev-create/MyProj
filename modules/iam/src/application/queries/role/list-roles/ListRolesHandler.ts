import type { Result } from '@workspace/kernel';
import { err, ok } from '@workspace/kernel';
import { Role } from '../../../../domain/Role.js';
import type { RoleRepository } from '../../../../domain/repositories/RoleRepository.js';
import type { ListRolesQuery } from './ListRolesQuery.js';
import type { ApplicationError } from '../../../ports/ApplicationError.js';
import { InternalApplicationError } from '../../../ports/ApplicationError.js';

export class ListRolesHandler {
  constructor(private readonly roleRepository: RoleRepository) {}

  async execute(query: ListRolesQuery): Promise<
    Result<
      {
        items: Role[];
        total: number;
        page: number;
        pageSize: number;
      },
      ApplicationError
    >
  > {
    try {
      // For now, use findAll. In future, implement pagination in repository
      const all = await this.roleRepository.findAll();

      // Apply search filter in memory (temporary solution)
      let filtered = all;
      if (query.search) {
        const searchLower = query.search.toLowerCase();
        filtered = filtered.filter((r) => r.name.value.toLowerCase().includes(searchLower));
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
          error instanceof Error ? error.message : 'Failed to list roles'
        )
      );
    }
  }
}
