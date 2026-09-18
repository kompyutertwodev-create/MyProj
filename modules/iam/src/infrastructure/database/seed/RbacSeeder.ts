import { eq, inArray } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { permissions } from '../schema/permissions.table.js';
import { rolePermissions } from '../schema/role-permissions.table.js';
import { roles } from '../schema/roles.table.js';
import { defaultPermissions } from './permissions.seed.js';
import { defaultRolePermissionNames, defaultRoles } from './roles.seed.js';

/**
 * Seeds the built-in RBAC vocabulary and its system-role mappings.
 *
 * Names are the stable identity of the seed records. Existing IDs are
 * respected when a database already contains a system role or permission.
 */
export async function seedDefaultRbac(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: NodePgDatabase<any>
): Promise<void> {
  await db.transaction(async (tx) => {
    await tx
      .insert(permissions)
      .values(defaultPermissions)
      .onConflictDoUpdate({
        target: permissions.name,
        set: { description: permissions.description },
      });

    await tx
      .insert(roles)
      .values([...defaultRoles])
      .onConflictDoUpdate({
        target: roles.name,
        set: {
          description: roles.description,
          isSystem: roles.isSystem,
        },
      });

    const persistedPermissions = await tx
      .select({ id: permissions.id, name: permissions.name })
      .from(permissions)
      .where(
        inArray(
          permissions.name,
          defaultPermissions.map((permission) => permission.name)
        )
      );
    const permissionIds = new Map(
      persistedPermissions.map((permission) => [permission.name, permission.id])
    );

    const persistedRoles = await tx
      .select({ id: roles.id, name: roles.name })
      .from(roles)
      .where(
        inArray(
          roles.name,
          defaultRoles.map((role) => role.name)
        )
      );
    const roleIds = new Map(persistedRoles.map((role) => [role.name, role.id]));

    for (const role of defaultRoles) {
      const roleId = roleIds.get(role.name);
      if (!roleId) throw new Error(`RBAC seed failed: role "${role.name}" was not persisted`);

      await tx.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId));
      const links = defaultRolePermissionNames[role.name].map((permissionName) => {
        const permissionId = permissionIds.get(permissionName);
        if (!permissionId) {
          throw new Error(`RBAC seed failed: permission "${permissionName}" was not persisted`);
        }
        return { roleId, permissionId };
      });

      if (links.length > 0) {
        await tx.insert(rolePermissions).values(links).onConflictDoNothing();
      }
    }
  });
}
