/**
 * Stable UUIDs for the four platform roles.
 *
 * Using well-known ids (instead of random v4) lets tests and the API
 * composition root reference roles without a lookup query, and keeps the
 * seed idempotent across environments.
 */
export const ROLE_IDS = {
  admin: '00000000-0000-0000-0000-000000000001',
  user: '00000000-0000-0000-0000-000000000002',
  moderator: '00000000-0000-0000-0000-000000000003',
  guest: '00000000-0000-0000-0000-000000000004',
} as const;

export type SeedRoleKey = keyof typeof ROLE_IDS;

/**
 * A seeded role definition.
 *
 * `isSystem: true` marks the role as immutable: the aggregate refuses
 * renames, permission mutations and deletion on such roles. Keep these
 * matching the semantics of the RBAC evaluator.
 */
export interface SeedRoleDefinition {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  permissionNames: readonly string[];
}

export const SEED_ROLES: readonly SeedRoleDefinition[] = [
  {
    id: ROLE_IDS.admin,
    name: 'admin',
    description: 'Full platform administrator вЂ” bypasses all checks',
    isSystem: true,
    permissionNames: ['admin:all'],
  },
  {
    id: ROLE_IDS.user,
    name: 'user',
    description: 'Default end-user role',
    isSystem: true,
    permissionNames: [
      'tenant:read',
      'user:read',
      'user:update',
      'role:read',
      'role:list',
      'permission:check',
    ],
  },
  {
    id: ROLE_IDS.moderator,
    name: 'moderator',
    description: 'Content and user moderation',
    isSystem: true,
    permissionNames: [
      'user:read',
      'user:list',
      'user:suspend',
      'role:read',
      'role:list',
      'permission:check',
    ],
  },
  {
    id: ROLE_IDS.guest,
    name: 'guest',
    description: 'Unauthenticated / anonymous visitor',
    isSystem: true,
    permissionNames: [],
  },
] as const;