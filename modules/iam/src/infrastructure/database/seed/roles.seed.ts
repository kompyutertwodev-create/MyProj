export const defaultRoles = [
  { id: 'iam-role-admin', name: 'admin', description: 'Platform administrator', isSystem: true },
  { id: 'iam-role-user', name: 'user', description: 'Standard user', isSystem: true },
  { id: 'iam-role-moderator', name: 'moderator', description: 'Content moderator', isSystem: true },
  {
    id: 'iam-role-guest',
    name: 'guest',
    description: 'Unauthenticated or limited user',
    isSystem: true,
  },
] as const;

export const defaultRolePermissionNames = {
  admin: [
    'users:read',
    'users:write',
    'users:delete',
    'roles:manage',
    'content:read',
    'content:write',
    'content:delete',
    'analytics:read',
    'admin:access',
  ],
  user: ['content:read'],
  moderator: ['content:read', 'content:write', 'content:delete'],
  guest: ['content:read'],
} as const;
