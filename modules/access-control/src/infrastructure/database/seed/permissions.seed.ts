/**
 * Canonical permission catalog.
 *
 * Format: `<resource>:<action>`. Every entry here is a *capability* that
 * can be granted to a role; the RBAC evaluator matches permissions by
 * exact string equality, so keep these values stable.
 *
 * Adding a permission is a breaking change for existing policies that
 * reference it вЂ” always add, never rename or remove.
 */
export interface PermissionDefinition {
  name: string;
  description: string;
}

export const PERMISSIONS: readonly PermissionDefinition[] = [
  // в”Ђв”Ђ Tenant в”Ђв”Ђ
  { name: 'tenant:create', description: 'Create a new tenant' },
  { name: 'tenant:read', description: 'Read tenant details' },
  { name: 'tenant:update', description: 'Update tenant settings' },
  { name: 'tenant:delete', description: 'Delete a tenant' },
  { name: 'tenant:member:add', description: 'Add a member to a tenant' },
  { name: 'tenant:member:remove', description: 'Remove a member from a tenant' },
  { name: 'tenant:member:list', description: 'List tenant members' },

  // в”Ђв”Ђ User в”Ђв”Ђ
  { name: 'user:create', description: 'Create a user' },
  { name: 'user:read', description: 'Read user details' },
  { name: 'user:update', description: 'Update a user' },
  { name: 'user:delete', description: 'Delete a user' },
  { name: 'user:list', description: 'List users' },
  { name: 'user:suspend', description: 'Suspend a user' },

  // в”Ђв”Ђ Role в”Ђв”Ђ
  { name: 'role:create', description: 'Create a role' },
  { name: 'role:read', description: 'Read role details' },
  { name: 'role:update', description: 'Update a role' },
  { name: 'role:delete', description: 'Delete a role' },
  { name: 'role:assign', description: 'Assign a role to a user' },
  { name: 'role:revoke', description: 'Revoke a role from a user' },
  { name: 'role:list', description: 'List roles' },

  // в”Ђв”Ђ Policy в”Ђв”Ђ
  { name: 'policy:create', description: 'Create an ABAC policy' },
  { name: 'policy:read', description: 'Read an ABAC policy' },
  { name: 'policy:update', description: 'Update an ABAC policy' },
  { name: 'policy:delete', description: 'Delete an ABAC policy' },
  { name: 'policy:list', description: 'List ABAC policies' },

  // в”Ђв”Ђ Authorization в”Ђв”Ђ
  { name: 'permission:check', description: 'Check whether a user has a permission' },

  // в”Ђв”Ђ Admin в”Ђв”Ђ
  { name: 'admin:all', description: 'Superuser wildcard вЂ” grants every capability' },
] as const;

/** Lookup set for O(1) membership checks. */
export const PERMISSION_NAMES: ReadonlySet<string> = new Set(
  PERMISSIONS.map((p) => p.name),
);