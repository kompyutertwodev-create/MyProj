import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  AssignRoleHandler,
  InMemoryIamEventBus,
  InMemoryRoleRepository,
  InMemoryUserRepository,
  PolicyEffect,
  PolicyService,
  SetInitialPasswordHandler,
} from '@workspace/iam';
import {
  Email,
  PasswordHash,
  Permission,
  Role,
  RoleId,
  RoleName,
  User,
  UserStatus,
} from '../../../modules/iam/src/domain/index.js';

function makePolicy(input: {
  id: string;
  effect: PolicyEffect;
  subjects: string[];
  resources: string[];
  actions: string[];
  conditions?: [];
}): {
  evaluate: (
    subjects: string[],
    resource: string,
    action: string,
    context: Record<string, unknown>
  ) => PolicyEffect | null;
  priority: number;
} {
  return {
    priority: 100,
    evaluate(subjects, resource, action, context) {
      const subjectMatch = input.subjects.some(
        (subject) => subject === '*' || subjects.includes(subject)
      );
      const resourceMatch = input.resources.some(
        (pattern) => pattern === '*' || pattern === resource
      );
      const actionMatch = input.actions.some((pattern) => pattern === '*' || pattern === action);
      if (!subjectMatch || !resourceMatch || !actionMatch) return null;
      if (input.conditions?.length && !input.conditions.every(() => Boolean(context))) return null;
      return input.effect;
    },
  };
}

function createService(
  policies: Array<ReturnType<typeof makePolicy>>,
  hasPermission = true
): PolicyService {
  const userRepository = {
    findById: async () => ({
      roles: [
        {
          name: { value: 'user' },
          hasPermission: (permission: string) => hasPermission && permission === 'content:read',
        },
      ],
      hasPermission: (permission: string) => hasPermission && permission === 'content:read',
    }),
  } as never;
  const policyRepository = {
    findForSubjects: async () => policies,
  } as never;
  return new PolicyService(policyRepository, userRepository);
}

test('allows a seeded RBAC permission when no ABAC policy is present', async () => {
  const service = createService([]);
  assert.equal(await service.canAccess('user-1', 'content', 'read'), true);
});

test('ABAC deny overrides an RBAC permission', async () => {
  const service = createService([
    makePolicy({
      id: 'deny-content',
      effect: PolicyEffect.Deny,
      subjects: ['role:user'],
      resources: ['content'],
      actions: ['read'],
    }),
  ]);
  assert.equal(await service.canAccess('user-1', 'content', 'read'), false);
});

test('defaults to deny when neither RBAC nor ABAC grants access', async () => {
  const service = createService([], false);
  assert.equal(await service.canAccess('user-1', 'content', 'read'), false);
});

test('assigns a role through the repository persistence boundary', async () => {
  const users = new InMemoryUserRepository();
  const roles = new InMemoryRoleRepository();
  const userRole = Role.create(new RoleId('role-user'), {
    name: RoleName.create('user').getOrThrow(),
    description: 'Standard user',
    permissions: [],
    isSystem: true,
  });
  const moderatorRole = Role.create(new RoleId('role-moderator'), {
    name: RoleName.create('moderator').getOrThrow(),
    description: 'Moderator',
    permissions: [Permission.create('content:moderate', 'Moderate content').getOrThrow()],
    isSystem: true,
  });
  await roles.save(userRole);
  await roles.save(moderatorRole);
  const user = User.create({
    email: Email.create('role-assignment@example.com').getOrThrow(),
    passwordHash: PasswordHash.create('hash'),
    displayName: 'Role Assignment',
    status: UserStatus.Active,
    roles: [userRole],
  }).getOrThrow();
  await users.save(user);

  const handler = new AssignRoleHandler(users, roles, new InMemoryIamEventBus());
  const result = await handler.execute({
    userId: user.id.value,
    roleName: 'moderator',
  });
  assert.equal(result.isOk(), true);
  const persisted = await users.findById(user.id.value);
  assert.deepEqual(
    persisted?.roles.map((role) => role.name.value),
    ['user', 'moderator']
  );

  const duplicate = await handler.execute({
    userId: user.id.value,
    roleName: 'moderator',
  });
  assert.equal(duplicate.isErr(), true);
  assert.equal(duplicate.error.code, 'VALIDATION_ERROR');
});

test('allows a social-first user to establish a local password once', async () => {
  const users = new InMemoryUserRepository();
  const user = User.create({
    email: Email.create('social-first@example.com').getOrThrow(),
    passwordHash: PasswordHash.create('provider-only-hash'),
    passwordSet: false,
    displayName: 'Social First',
    status: UserStatus.Active,
  }).getOrThrow();
  await users.save(user);

  const passwordService = {
    validateStrength: () => ({ isErr: () => false }),
    hash: async (password: string) => `hashed:${password}`,
  } as never;
  const handler = new SetInitialPasswordHandler(users, passwordService, new InMemoryIamEventBus());

  const result = await handler.execute({
    userId: user.id.value,
    newPassword: 'LocalPass123!',
  });
  assert.equal(result.isOk(), true);
  assert.equal((await users.findById(user.id.value))?.passwordSet, true);
  assert.equal((await users.findById(user.id.value))?.passwordHash.value, 'hashed:LocalPass123!');

  const secondAttempt = await handler.execute({
    userId: user.id.value,
    newPassword: 'AnotherPass123!',
  });
  assert.equal(secondAttempt.isErr(), true);
  assert.equal(secondAttempt.error.code, 'CONFLICT');
});
