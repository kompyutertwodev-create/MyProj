import { describe, it, expect } from 'vitest';
import { Permission } from '../Permission.js';

describe('Permission', () => {
  it('create() validates format "resource:action"', () => {
    const permission = Permission.create('tenant:create', 'Create tenant').getOrThrow();

    expect(permission.name).toBe('tenant:create');
    expect(permission.description).toBe('Create tenant');
  });

  it('create() rejects empty name', () => {
    const result = Permission.create('', 'desc');

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe('PERMISSION_NAME_EMPTY');
    }
  });

  it('create() rejects whitespace-only name', () => {
    const result = Permission.create('   ', 'desc');

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe('PERMISSION_NAME_EMPTY');
    }
  });

  it('create() rejects invalid format (missing colon)', () => {
    const result = Permission.create('tenantcreate', 'desc');

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe('PERMISSION_NAME_INVALID');
    }
  });

  it('create() rejects invalid format (multiple colons)', () => {
    const result = Permission.create('tenant:create:action', 'desc');

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe('PERMISSION_NAME_INVALID');
    }
  });

  it('create() rejects invalid format (uppercase)', () => {
    const result = Permission.create('Tenant:Create', 'desc');

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe('PERMISSION_NAME_INVALID');
    }
  });

  it('create() rejects invalid format (special chars)', () => {
    const result = Permission.create('tenant@create', 'desc');

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe('PERMISSION_NAME_INVALID');
    }
  });

  it('create() accepts underscore separators', () => {
    const permission = Permission.create('tenant_settings:create', 'desc').getOrThrow();

    expect(permission.name).toBe('tenant_settings:create');
  });

  it('create() accepts empty description', () => {
    const permission = Permission.create('tenant:create', '').getOrThrow();

    expect(permission.description).toBe('');
  });

  it('create() accepts null description', () => {
    const permission = Permission.create('tenant:create', null as any).getOrThrow();

    expect(permission.description).toBe('');
  });

  it('toString() returns name', () => {
    const permission = Permission.create('tenant:create', 'desc').getOrThrow();

    expect(permission.toString()).toBe('tenant:create');
  });

  it('equals() compares name and description', () => {
    const perm1 = Permission.create('tenant:create', 'desc1').getOrThrow();
    const perm2 = Permission.create('tenant:create', 'desc1').getOrThrow();
    const perm3 = Permission.create('tenant:create', 'desc2').getOrThrow();
    const perm4 = Permission.create('tenant:read', 'desc3').getOrThrow();

    expect(perm1.equals(perm2)).toBe(true);
    expect(perm1.equals(perm3)).toBe(false); // different description
    expect(perm1.equals(perm4)).toBe(false); // different name
  });
});