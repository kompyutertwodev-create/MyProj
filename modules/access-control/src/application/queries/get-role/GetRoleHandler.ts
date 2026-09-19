import { err, ok, type Result } from '@workspace/kernel';
import { RoleId } from '../../../domain/role/RoleId.js';
import type { AccessControlUnitOfWork } from '../../ports/AccessControlUnitOfWork.js';
import {
  ApplicationError,
  NotFoundApplicationError,
  ValidationApplicationError,
} from '../../ports/ApplicationError.js';
import type { GetRoleQuery } from './GetRoleQuery.js';

/**
 * Read model for a Role.
 *
 * The query layer returns a plain DTO, never the aggregate, so that
 * consumers cannot accidentally mutate state or trigger lazy-loads.
 */
export interface RoleView {
  id: string;
  name: string;
  description: string;
  permissionNames: string[];
  isSystem: boolean;
  tenantId: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
}

/**
 * Load a Role by id and project it into a flat view.
 *
 * Returns a `NotFoundApplicationError` when the role does not exist so the
 * HTTP layer can map it directly to a 404 response.
 */
export class GetRoleHandler {
  constructor(private readonly uow: AccessControlUnitOfWork) {}

  async execute(
    query: GetRoleQuery,
  ): Promise<Result<RoleView, ApplicationError>> {
    const roleId = (query.roleId ?? '').trim();
    if (roleId.length === 0) {
      return err(
        new ValidationApplicationError('roleId is required', 'ROLE_ID_REQUIRED'),
      );
    }

    const role = await this.uow.roles.findById(new RoleId(roleId));
    if (!role) {
      return err(
        new NotFoundApplicationError(
          `Role "${roleId}" was not found`,
          'ROLE_NOT_FOUND',
        ),
      );
    }

    return ok({
      id: role.id.value,
      name: role.name.value,
      description: role.description,
      permissionNames: role.permissionNames(),
      isSystem: role.isSystem,
      tenantId: role.tenantId,
      createdAt: role.createdAt.toISOString(),
      updatedAt: role.updatedAt.toISOString(),
      version: role.version,
    });
  }
}