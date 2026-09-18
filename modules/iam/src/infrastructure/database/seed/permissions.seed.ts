const permissionNames = [
  'users:read',
  'users:write',
  'users:delete',
  'roles:manage',
  'content:read',
  'content:write',
  'content:delete',
  'analytics:read',
  'admin:access',
] as const;

export const defaultPermissions = permissionNames.map((name) => ({
  id: `iam-permission-${name.replace(':', '-')}`,
  name,
  description: `Permission to ${name.replace(':', ' ')}`,
}));
