import { err, ok, type Result } from '@workspace/kernel';
import type { AccessControlUnitOfWork } from '../../ports/AccessControlUnitOfWork.js';
import {
  ApplicationError,
  ValidationApplicationError,
} from '../../ports/ApplicationError.js';
import type { ListRolesQuery } from './ListRolesQuery.js';

/** Flat read model for a single role inside a list response. */
export interface RoleListItem {
  id: string;
  name: string;
  description: string;
  permissionNames: string[];
  isSystem: boolean;
  tenantId: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Paginated list response. */
export interface ListRolesResult {
  items: RoleListItem[];
  total: number;
  page: number | null;
  pageSize: number | null;
}

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 200;

/**
 * List roles, optionally paginated and filtered by tenant / search term.
 *
 * The tenant filter is applied by the repository (`findByTenant`) so the
 * read path never loads rows it will discard. Free-text search is a simple
 * case-insensitive substring match applied in-memory вЂ” replace with a DB
 * query if the role set ever grows beyond a few hundred entries per tenant.
 */
export class ListRolesHandler {
  constructor(private readonly uow: AccessControlUnitOfWork) {}

  async execute(
    query: ListRolesQuery,
  ): Promise<Result<ListRolesResult, ApplicationError>> {
    // Validate pagination params when present.
    if (query.page !== undefined) {
      if (!Number.isInteger(query.page) || query.page < 1) {
        return err(
          new ValidationApplicationError(
            'page must be a positive integer',
            'PAGE_INVALID',
          ),
        );
      }
    }
    if (query.pageSize !== undefined) {
      if (
        !Number.isInteger(query.pageSize) ||
        query.pageSize < 1 ||
        query.pageSize > MAX_PAGE_SIZE
      ) {
        return err(
          new ValidationApplicationError(
            `pageSize must be between 1 and ${MAX_PAGE_SIZE}`,
            'PAGE_SIZE_INVALID',
          ),
        );
      }
    }

    const all =
      query.tenantId !== undefined
        ? await this.uow.roles.findByTenant(query.tenantId)
        : await this.uow.roles.findAll();

    const search = (query.search ?? '').trim().toLowerCase();
    const filtered = search.length
      ? all.filter((r) => r.name.value.toLowerCase().includes(search))
      : all;

    const projected: RoleListItem[] = filtered.map((r) => ({
      id: r.id.value,
      name: r.name.value,
      description: r.description,
      permissionNames: r.permissionNames(),
      isSystem: r.isSystem,
      tenantId: r.tenantId,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));

    if (query.page === undefined) {
      return ok({
        items: projected,
        total: projected.length,
        page: null,
        pageSize: null,
      });
    }

    const pageSize = query.pageSize ?? DEFAULT_PAGE_SIZE;
    const page = query.page;
    const start = (page - 1) * pageSize;
    const slice = projected.slice(start, start + pageSize);

    return ok({
      items: slice,
      total: projected.length,
      page,
      pageSize,
    });
  }
}