import { describe, it, expect } from 'vitest';
import { Role } from '../Role.js';
import { RoleId } from '../RoleId.js';
import { RoleName } from '../RoleName.js';
import { Permission } from '../../permission/Permission.js';

describe('Role', () => {
  it('create() builds an active role with RoleCreatedEvent', () => {
    const name = RoleName.create('admin').getOrThrow();
    const result = Role.create({ name, description: 'Administrator role', permissions: [] });

    expect(result.isOk()).toBe(true);
    const role = (result as any).value;
    expect(role.name.value).toBe('admin');
    expect(role.description).toBe('Administrator role');
    expect(role.permissions.length).toBe(0);
    expect(role.isSystem).toBe(false);
    expect(role.tenantId).toBe(null);
    expect(role.version).toBe(1); // apply() increments version

    const events = role.pullDomainEvents();
    expect(events.length).toBe(1);
    expect(events[0].eventName).toBe('access-control.role.created');
    expect(events[0].aggregateId).toBe(role.id.value);
    expect((events[0] as any).name).toBe('admin');
    expect((events[0] as any).isSystem).toBe(false);
  });

  it('create() validates description length', () => {
    const name = RoleName.create('admin').getOrThrow();
    const longDesc = 'a'.repeat(501);
    const result = Role.create({ name, description: longDesc, permissions: [] });

    expect(result.isErr()).toBe(true);
    expect((result as any).error.code).toBe('ROLE_DESCRIPTION_TOO_LONG');
  });

  it('create() accepts permissions', () => {
    const name = RoleName.create('admin').getOrThrow();
    const permissions = [
      Permission.create('tenant:create', 'Create tenant').getOrThrow(),
      Permission.create('tenant:read', 'Read tenant').getOrThrow(),
    ];
    const result = Role.create({ name, description: '', permissions });

    expect(result.isOk()).toBe(true);
    const role = result.value;
    expect(role.permissions.length).toBe(2);
    expect(role.permissions[0].name).toBe('tenant:create');
    expect(role.permissions[1].name).toBe('tenant:read');
  });

  it('create() marks as system when specified', () => {
    const name = RoleName.create('admin').getOrThrow();
    const result = Role.create({ name, description: '', permissions: [], isSystem: true });

    expect(result.isOk()).toBe(true);
    expect(result.value.isSystem).toBe(true);
  });

  it('create() accepts tenantId', () => {
    const name = RoleName.create('admin').getOrThrow();
    const result = Role.create({ name, description: '', permissions: [], tenantId: 'tenant-123' });

    expect(result.isOk()).toBe(true);
    expect(result.value.tenantId).toBe('tenant-123');
  });

  it('create() accepts custom id', () => {
    const name = RoleName.create('admin').getOrThrow();
    const customId = new RoleId();
    const result = Role.create({ name, description: '', permissions: [] }, customId);

    expect(result.isOk()).toBe(true);
    expect(result.value.id.value).toBe(customId.value);
  });

  it('reconstruct() rebuilds from persistence', () => {
    const name = RoleName.create('admin').getOrThrow();
    const permissions = [Permission.create('tenant:create', '').getOrThrow()];
    const props = {
      id: new RoleId(),
      name,
      description: 'Admin',
      permissions,
      isSystem: false,
      tenantId: 'tenant-123',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-02'),
      version: 5,
    };

    const role = Role.reconstruct(props);

    expect(role.id.value).toBe(props.id.value);
    expect(role.name.value).toBe('admin');
    expect(role.description).toBe('Admin');
    expect(role.permissions.length).toBe(1);
    expect(role.isSystem).toBe(false);
    expect(role.tenantId).toBe('tenant-123');
    expect(role.createdAt.toISOString()).toBe('2024-01-01T00:00:00.000Z');
    expect(role.updatedAt.toISOString()).toBe('2024-01-02T00:00:00.000Z');
    expect(role.version).toBe(5);
  });

  it('rename() changes name and emits RoleUpdatedEvent', () => {
    const name = RoleName.create('admin').getOrThrow();
    const role = Role.create({ name, description: '', permissions: [] }).getOrThrow();
    role.pullDomainEvents(); // clear creation event

    const newName = RoleName.create('superadmin').getOrThrow();
    const result = role.rename(newName);

    expect(result.isOk()).toBe(true);
    expect(role.name.value).toBe('superadmin');

    const events = role.pullDomainEvents();
    expect(events.length).toBe(1);
    expect(events[0].eventName).toBe('access-control.role.updated');
    expect(events[0].name).toBe('superadmin');
  });

  it('rename() rejects system role', () => {
    const name = RoleName.create('admin').getOrThrow();
    const role = Role.create({ name, description: '', permissions: [], isSystem: true }).getOrThrow();

    const newName = RoleName.create('superadmin').getOrThrow();
    const result = role.rename(newName);

    expect(result.isErr()).toBe(true);
    expect((result as any).error.code).toBe('ROLE_SYSTEM_IMMUTABLE');
  });

  it('rename() rejects unchanged name', () => {
    const name = RoleName.create('admin').getOrThrow();
    const role = Role.create({ name, description: '', permissions: [] }).getOrThrow();

    const result = role.rename(name);

    expect(result.isErr()).toBe(true);
    expect((result as any).error.code).toBe('ROLE_NAME_UNCHANGED');
  });

  it('updateDescription() changes description and emits RoleUpdatedEvent', () => {
    const name = RoleName.create('admin').getOrThrow();
    const role = Role.create({ name, description: 'Old desc', permissions: [] }).getOrThrow();
    role.pullDomainEvents();

    const result = role.updateDescription('New desc');

    expect(result.isOk()).toBe(true);
    expect(role.description).toBe('New desc');

    const events = role.pullDomainEvents();
    expect(events.length).toBe(1);
    expect(events[0].eventName).toBe('access-control.role.updated');
  });

  it('updateDescription() validates length', () => {
    const name = RoleName.create('admin').getOrThrow();
    const role = Role.create({ name, description: '', permissions: [] }).getOrThrow();

    const result = role.updateDescription('a'.repeat(501));

    expect(result.isErr()).toBe(true);
    expect((result as any).error.code).toBe('ROLE_DESCRIPTION_TOO_LONG');
  });

  it('updateDescription() rejects unchanged description', () => {
    const name = RoleName.create('admin').getOrThrow();
    const role = Role.create({ name, description: 'Same', permissions: [] }).getOrThrow();

    const result = role.updateDescription('Same');

    expect(result.isErr()).toBe(true);
    expect((result as any).error.code).toBe('ROLE_DESCRIPTION_UNCHANGED');
  });

  it('addPermission() adds permission and emits RolePermissionAddedEvent', () => {
    const name = RoleName.create('admin').getOrThrow();
    const role = Role.create({ name, description: '', permissions: [] }).getOrThrow();
    role.pullDomainEvents();

    const permission = Permission.create('tenant:create', '').getOrThrow();
    const result = role.addPermission(permission);

    expect(result.isOk()).toBe(true);
    expect(role.permissions.length).toBe(1);
    expect(role.permissions[0].name).toBe('tenant:create');

    const events = role.pullDomainEvents();
    expect(events.length).toBe(1);
    expect(events[0].eventName).toBe('access-control.role.permission-added');
    expect(events[0].permissionName).toBe('tenant:create');
  });

  it('addPermission() rejects system role', () => {
    const name = RoleName.create('admin').getOrThrow();
    const role = Role.create({ name, description: '', permissions: [], isSystem: true }).getOrThrow();

    const permission = Permission.create('tenant:create', '').getOrThrow();
    const result = role.addPermission(permission);

    expect(result.isErr()).toBe(true);
    expect((result as any).error.code).toBe('ROLE_SYSTEM_IMMUTABLE');
  });

  it('addPermission() rejects duplicate permission', () => {
    const name = RoleName.create('admin').getOrThrow();
    const permission = Permission.create('tenant:create', '').getOrThrow();
    const role = Role.create({ name, description: '', permissions: [permission] }).getOrThrow();

    const result = role.addPermission(permission);

    expect(result.isErr()).toBe(true);
    expect((result as any).error.code).toBe('ROLE_PERMISSION_DUPLICATE');
  });

  it('removePermission() removes permission and emits RolePermissionRemovedEvent', () => {
    const name = RoleName.create('admin').getOrThrow();
    const permission = Permission.create('tenant:create', '').getOrThrow();
    const role = Role.create({ name, description: '', permissions: [permission] }).getOrThrow();
    role.pullDomainEvents();

    const result = role.removePermission('tenant:create');

    expect(result.isOk()).toBe(true);
    expect(role.permissions.length).toBe(0);

    const events = role.pullDomainEvents();
    expect(events.length).toBe(1);
    expect(events[0].eventName).toBe('access-control.role.permission-removed');
    expect(events[0].permissionName).toBe('tenant:create');
  });

  it('removePermission() rejects system role', () => {
    const name = RoleName.create('admin').getOrThrow();
    const permission = Permission.create('tenant:create', '').getOrThrow();
    const role = Role.create({ name, description: '', permissions: [permission], isSystem: true }).getOrThrow();

    const result = role.removePermission('tenant:create');

    expect(result.isErr()).toBe(true);
    expect((result as any).error.code).toBe('ROLE_SYSTEM_IMMUTABLE');
  });

  it('removePermission() rejects missing permission', () => {
    const name = RoleName.create('admin').getOrThrow();
    const role = Role.create({ name, description: '', permissions: [] }).getOrThrow();

    const result = role.removePermission('tenant:create');

    expect(result.isErr()).toBe(true);
    expect((result as any).error.code).toBe('ROLE_PERMISSION_NOT_FOUND');
  });

  it('replacePermissions() replaces all permissions', () => {
    const name = RoleName.create('admin').getOrThrow();
    const oldPermissions = [
      Permission.create('tenant:create', '').getOrThrow(),
      Permission.create('tenant:read', '').getOrThrow(),
    ];
    const role = Role.create({ name, description: '', permissions: oldPermissions }).getOrThrow();
    role.pullDomainEvents();

    const newPermissions = [
      Permission.create('tenant:update', '').getOrThrow(),
      Permission.create('tenant:delete', '').getOrThrow(),
    ];
    const result = role.replacePermissions(newPermissions);

    expect(result.isOk()).toBe(true);
    expect(role.permissions.length).toBe(2);
    expect(role.permissions[0].name).toBe('tenant:update');
    expect(role.permissions[1].name).toBe('tenant:delete');

    const events = role.pullDomainEvents();
    expect(events.length).toBe(4); // 2 removals + 2 additions
  });

  it('replacePermissions() rejects system role', () => {
    const name = RoleName.create('admin').getOrThrow();
    const role = Role.create({ name, description: '', permissions: [], isSystem: true }).getOrThrow();

    const result = role.replacePermissions([]);

    expect(result.isErr()).toBe(true);
    expect((result as any).error.code).toBe('ROLE_SYSTEM_IMMUTABLE');
  });

  it('delete() emits RoleDeletedEvent', () => {
    const name = RoleName.create('admin').getOrThrow();
    const role = Role.create({ name, description: '', permissions: [] }).getOrThrow();
    role.pullDomainEvents();

    const result = role.delete('user-123');

    expect(result.isOk()).toBe(true);

    const events = role.pullDomainEvents();
    expect(events.length).toBe(1);
    expect(events[0].eventName).toBe('access-control.role.deleted');
    expect(events[0].deletedBy).toBe('user-123');
  });

  it('delete() rejects system role', () => {
    const name = RoleName.create('admin').getOrThrow();
    const role = Role.create({ name, description: '', permissions: [], isSystem: true }).getOrThrow();

    const result = role.delete('user-123');

    expect(result.isErr()).toBe(true);
    expect((result as any).error.code).toBe('ROLE_SYSTEM_IMMUTABLE');
  });

  it('delete() rejects empty deletedBy', () => {
    const name = RoleName.create('admin').getOrThrow();
    const role = Role.create({ name, description: '', permissions: [] }).getOrThrow();

    const result = role.delete('');

    expect(result.isErr()).toBe(true);
    expect((result as any).error.code).toBe('ROLE_DELETED_BY_EMPTY');
  });

  it('hasPermission() returns true for granted permission', () => {
    const name = RoleName.create('admin').getOrThrow();
    const permission = Permission.create('tenant:create', '').getOrThrow();
    const role = Role.create({ name, description: '', permissions: [permission] }).getOrThrow();

    expect(role.hasPermission('tenant:create')).toBe(true);
    expect(role.hasPermission('tenant:read')).toBe(false);
  });

  it('permissionNames() returns array of permission names', () => {
    const name = RoleName.create('admin').getOrThrow();
    const permissions = [
      Permission.create('tenant:create', '').getOrThrow(),
      Permission.create('tenant:read', '').getOrThrow(),
    ];
    const role = Role.create({ name, description: '', permissions }).getOrThrow();

    const names = role.permissionNames();
    expect(names.length).toBe(2);
    expect(names.includes('tenant:create')).toBe(true);
    expect(names.includes('tenant:read')).toBe(true);
  });
});
