import { describe, it, expect } from 'vitest';
import { RoleName } from '../RoleName.js';

describe('RoleName', () => {
  it('create() normalizes to lowercase', () => {
    const result = RoleName.create('ADMIN');

    expect(result.isOk()).toBe(true);
    expect((result as any).value.value).toBe('admin');
  });

  it('create() trims whitespace', () => {
    const result = RoleName.create('  admin  ');

    expect(result.isOk()).toBe(true);
    expect((result as any).value.value).toBe('admin');
  });

  it('create() rejects empty string', () => {
    const result = RoleName.create('');

    expect(result.isErr()).toBe(true);
    expect((result as any).error.code).toBe('ROLE_NAME_EMPTY');
  });

  it('create() rejects whitespace-only string', () => {
    const result = RoleName.create('   ');

    expect(result.isErr()).toBe(true);
    expect((result as any).error.code).toBe('ROLE_NAME_EMPTY');
  });

  it('create() accepts admin constant', () => {
    const result = RoleName.create(RoleName.ADMIN);

    expect(result.isOk()).toBe(true);
    expect((result as any).value.value).toBe('admin');
  });

  it('create() accepts user constant', () => {
    const result = RoleName.create(RoleName.USER);

    expect(result.isOk()).toBe(true);
    expect((result as any).value.value).toBe('user');
  });

  it('create() accepts moderator constant', () => {
    const result = RoleName.create(RoleName.MODERATOR);

    expect(result.isOk()).toBe(true);
    expect((result as any).value.value).toBe('moderator');
  });

  it('create() accepts guest constant', () => {
    const result = RoleName.create(RoleName.GUEST);

    expect(result.isOk()).toBe(true);
    expect((result as any).value.value).toBe('guest');
  });

  it('create() accepts custom names', () => {
    const result = RoleName.create('custom-role');

    expect(result.isOk()).toBe(true);
    expect((result as any).value.value).toBe('custom-role');
  });

  it('toString() returns value', () => {
    const roleName = RoleName.create('admin').getOrThrow();

    expect(roleName.toString()).toBe('admin');
  });

  it('equals() compares values', () => {
    const name1 = RoleName.create('admin').getOrThrow();
    const name2 = RoleName.create('admin').getOrThrow();
    const name3 = RoleName.create('user').getOrThrow();

    expect(name1.equals(name2)).toBe(true);
    expect(name1.equals(name3)).toBe(false);
  });
});
