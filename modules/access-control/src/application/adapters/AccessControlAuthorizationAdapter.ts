import type { CheckPermissionHandler } from '../queries/check-permission/CheckPermissionHandler.js';
import type { ListUserRolesHandler } from '../queries/list-user-roles/ListUserRolesHandler.js';

/**
 * Shape of the IAM module's AuthorizationPort.
 *
 * Declared locally (not imported from @workspace/iam) so access-control
 * does not take a compile-time dependency on iam. The composition root
 * checks structural compatibility when it wires the two together.
 */
export interface AuthorizationPort {
  getRoleNames(userId: string): Promise<string[]>;
  checkPermission(input: {
    userId: string;
    resource: string;
    action: string;
    resourceAttributes?: Record<string, unknown>;
    environmentAttributes?: Record<string, unknown>;
  }): Promise<{ allowed: boolean; reason: string }>;
}

/**
 * Adapter that satisfies IAM's AuthorizationPort by delegating to the
 * access-control query handlers.
 *
 * Field names are suffixed with `Handler` to avoid clashing with the
 * methods of the same conceptual name (a `checkPermission` field and a
 * `checkPermission` method cannot coexist on the same object).
 */
export class AccessControlAuthorizationAdapter implements AuthorizationPort {
  constructor(
    private readonly checkPermissionHandler: CheckPermissionHandler,
    private readonly listUserRolesHandler: ListUserRolesHandler,
  ) {}

  async getRoleNames(userId: string): Promise<string[]> {
    const result = await this.listUserRolesHandler.execute({
      userId,
      includeInactive: false,
    });
    if (result.isErr()) return [];

    const names = new Set<string>();
    for (const item of result.value.items) {
      if (item.isActive) names.add(item.roleName);
    }
    return [...names];
  }

  async checkPermission(input: {
    userId: string;
    resource: string;
    action: string;
    resourceAttributes?: Record<string, unknown>;
    environmentAttributes?: Record<string, unknown>;
  }): Promise<{ allowed: boolean; reason: string }> {
    const result = await this.checkPermissionHandler.execute({
      userId: input.userId,
      resource: input.resource,
      action: input.action,
      resourceAttributes: input.resourceAttributes,
      environmentAttributes: input.environmentAttributes,
    });
    if (result.isErr()) {
      return { allowed: false, reason: 'evaluation_error' };
    }
    return { allowed: result.value.allowed, reason: result.value.reason };
  }
}