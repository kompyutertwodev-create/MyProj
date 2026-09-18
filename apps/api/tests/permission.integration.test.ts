import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  CheckPermissionHandler,
  InMemoryUserRepository,
  InMemoryRoleRepository,
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

test('checks user permission', async () => {
  const users = new InMemoryUserRepository();
  const roles = new InMemoryRoleRepository();
  const handler = new CheckPermissionHandler(users);

  const userRole = Role.create(new RoleId('role-user'), {
    name: RoleName.create('user').getOrThrow(),
    description: 'Standard user',
    permissions: [Permission.create('users:read', 'Read users').getOrThrow()],
    isSystem: true,
  });
  await roles.save(userRole);

  const user = User.create({
    email: Email.create('perm@example.com').getOrThrow(),
    passwordHash: PasswordHash.create('hash'),
    displayName: 'Permission User',
    status: UserStatus.Active,
    roles: [userRole],
  }).getOrThrow();
  await users.save(user);

  const result = await handler.execute({
    userId: user.id.value,
    permission: 'users:read',
  });

  assert.equal(result, true);
});

test('returns false for non-existent permission', async () => {
  const users = new InMemoryUserRepository();
  const roles = new InMemoryRoleRepository();
  const handler = new CheckPermissionHandler(users);

  const userRole = Role.create(new RoleId('role-user'), {
    name: RoleName.create('user').getOrThrow(),
    description: 'Standard user',
    permissions: [Permission.create('users:read', 'Read users').getOrThrow()],
    isSystem: true,
  });
  await roles.save(userRole);

  const user = User.create({
    email: Email.create('perm2@example.com').getOrThrow(),
    passwordHash: PasswordHash.create('hash'),
    displayName: 'Permission User 2',
    status: UserStatus.Active,
    roles: [userRole],
  }).getOrThrow();
  await users.save(user);

  const result = await handler.execute({
    userId: user.id.value,
    permission: 'users:write',
  });

  assert.equal(result, false);
});

test('returns false for non-existent user', async () => {
  const users = new InMemoryUserRepository();
  const handler = new CheckPermissionHandler(users);

  const result = await handler.execute({
    userId: 'non-existent-id',
    permission: 'users:read',
  });

  assert.equal(result, false);
});
