import { describe, it, expect, vi } from 'vitest';
import { err, ok } from '@workspace/kernel';
import { AccessControlAuthorizationAdapter } from '../AccessControlAuthorizationAdapter.js';
import type { CheckPermissionHandler } from '../../queries/check-permission/CheckPermissionHandler.js';
import type { ListUserRolesHandler } from '../../queries/list-user-roles/ListUserRolesHandler.js';
import { ValidationApplicationError } from '../../ports/ApplicationError.js';

function makeListUserRolesHandler(
  result: Awaited<ReturnType<ListUserRolesHandler['execute']>>,
): ListUserRolesHandler {
  return { execute: vi.fn().mockResolvedValue(result) } as unknown as ListUserRolesHandler;
}

function makeCheckPermissionHandler(
  result: Awaited<ReturnType<CheckPermissionHandler['execute']>>,
): CheckPermissionHandler {
  return { execute: vi.fn().mockResolvedValue(result) } as unknown as CheckPermissionHandler;
}

function makeItem(overrides: Partial<{
  assignmentId: string;
  roleId: string;
  roleName: string;
  isActive: boolean;
}> = {}) {
  return {
    assignmentId: overrides.assignmentId ?? 'assignment-1',
    roleId: overrides.roleId ?? 'role-1',
    roleName: overrides.roleName ?? 'user',
    tenantId: null,
    assignedBy: 'admin-1',
    assignedAt: '2026-01-01T00:00:00.000Z',
    expiresAt: null,
    revokedAt: null,
    isActive: overrides.isActive ?? true,
  };
}

describe('AccessControlAuthorizationAdapter', () => {
  describe('getRoleNames', () => {
    it('returns role names from active items', async () => {
      const listUserRoles = makeListUserRolesHandler(
        ok({
          userId: 'user-1',
          items: [
            makeItem({ roleName: 'admin' }),
            makeItem({ roleName: 'user' }),
          ],
          total: 2,
        }),
      );
      const checkPermission = makeCheckPermissionHandler(
        ok({ allowed: false, reason: 'no_match', matchedPolicyIds: [], matchedRoleNames: [] }),
      );
      const adapter = new AccessControlAuthorizationAdapter(checkPermission, listUserRoles);

      const result = await adapter.getRoleNames('user-1');

      expect(result).toEqual(['admin', 'user']);
    });

    it('filters out inactive items', async () => {
      const listUserRoles = makeListUserRolesHandler(
        ok({
          userId: 'user-1',
          items: [
            makeItem({ roleName: 'admin', isActive: true }),
            makeItem({ roleName: 'guest', isActive: false }),
          ],
          total: 2,
        }),
      );
      const checkPermission = makeCheckPermissionHandler(
        ok({ allowed: false, reason: 'no_match', matchedPolicyIds: [], matchedRoleNames: [] }),
      );
      const adapter = new AccessControlAuthorizationAdapter(checkPermission, listUserRoles);

      const result = await adapter.getRoleNames('user-1');

      expect(result).toEqual(['admin']);
    });

    it('deduplicates role names', async () => {
      const listUserRoles = makeListUserRolesHandler(
        ok({
          userId: 'user-1',
          items: [
            makeItem({ roleName: 'admin' }),
            makeItem({ roleName: 'admin' }),
            makeItem({ roleName: 'user' }),
          ],
          total: 3,
        }),
      );
      const checkPermission = makeCheckPermissionHandler(
        ok({ allowed: false, reason: 'no_match', matchedPolicyIds: [], matchedRoleNames: [] }),
      );
      const adapter = new AccessControlAuthorizationAdapter(checkPermission, listUserRoles);

      const result = await adapter.getRoleNames('user-1');

      expect(result).toHaveLength(2);
      expect(result).toEqual(expect.arrayContaining(['admin', 'user']));
    });

    it('returns empty array when user has no roles', async () => {
      const listUserRoles = makeListUserRolesHandler(
        ok({ userId: 'user-1', items: [], total: 0 }),
      );
      const checkPermission = makeCheckPermissionHandler(
        ok({ allowed: false, reason: 'no_match', matchedPolicyIds: [], matchedRoleNames: [] }),
      );
      const adapter = new AccessControlAuthorizationAdapter(checkPermission, listUserRoles);

      const result = await adapter.getRoleNames('user-1');

      expect(result).toEqual([]);
    });

    it('returns empty array (deny-by-default) when handler errors', async () => {
      const listUserRoles = makeListUserRolesHandler(
        err(new ValidationApplicationError('userId is required', 'USER_ID_REQUIRED')),
      );
      const checkPermission = makeCheckPermissionHandler(
        ok({ allowed: false, reason: 'no_match', matchedPolicyIds: [], matchedRoleNames: [] }),
      );
      const adapter = new AccessControlAuthorizationAdapter(checkPermission, listUserRoles);

      const result = await adapter.getRoleNames('');

      expect(result).toEqual([]);
    });
  });

  describe('checkPermission', () => {
    it('returns allowed=true with reason from the handler', async () => {
      const listUserRoles = makeListUserRolesHandler(
        ok({ userId: 'user-1', items: [], total: 0 }),
      );
      const checkPermission = makeCheckPermissionHandler(
        ok({
          allowed: true,
          reason: 'rbac:role:admin',
          matchedPolicyIds: [],
          matchedRoleNames: ['admin'],
        }),
      );
      const adapter = new AccessControlAuthorizationAdapter(checkPermission, listUserRoles);

      const result = await adapter.checkPermission({
        userId: 'user-1',
        resource: 'document',
        action: 'read',
      });

      expect(result).toEqual({ allowed: true, reason: 'rbac:role:admin' });
    });

    it('returns allowed=false with reason from the handler', async () => {
      const listUserRoles = makeListUserRolesHandler(
        ok({ userId: 'user-1', items: [], total: 0 }),
      );
      const checkPermission = makeCheckPermissionHandler(
        ok({
          allowed: false,
          reason: 'no_match',
          matchedPolicyIds: [],
          matchedRoleNames: [],
        }),
      );
      const adapter = new AccessControlAuthorizationAdapter(checkPermission, listUserRoles);

      const result = await adapter.checkPermission({
        userId: 'user-1',
        resource: 'document',
        action: 'delete',
      });

      expect(result).toEqual({ allowed: false, reason: 'no_match' });
    });

    it('returns deny-by-default when handler errors', async () => {
      const listUserRoles = makeListUserRolesHandler(
        ok({ userId: 'user-1', items: [], total: 0 }),
      );
      const checkPermission = makeCheckPermissionHandler(
        err(new ValidationApplicationError('resource is required', 'RESOURCE_REQUIRED')),
      );
      const adapter = new AccessControlAuthorizationAdapter(checkPermission, listUserRoles);

      const result = await adapter.checkPermission({
        userId: 'user-1',
        resource: '',
        action: 'read',
      });

      expect(result).toEqual({ allowed: false, reason: 'evaluation_error' });
    });

    it('forwards resource and environment attributes to the handler', async () => {
      const listUserRoles = makeListUserRolesHandler(
        ok({ userId: 'user-1', items: [], total: 0 }),
      );
      const execute = vi.fn().mockResolvedValue(
        ok({ allowed: true, reason: 'abac:owner', matchedPolicyIds: ['p1'], matchedRoleNames: [] }),
      );
      const checkPermission = { execute } as unknown as CheckPermissionHandler;
      const adapter = new AccessControlAuthorizationAdapter(checkPermission, listUserRoles);

      await adapter.checkPermission({
        userId: 'user-1',
        resource: 'document',
        action: 'read',
        resourceAttributes: { ownerId: 'user-1' },
        environmentAttributes: { ip: '127.0.0.1' },
      });

      expect(execute).toHaveBeenCalledWith({
        userId: 'user-1',
        resource: 'document',
        action: 'read',
        resourceAttributes: { ownerId: 'user-1' },
        environmentAttributes: { ip: '127.0.0.1' },
      });
    });
  });
});