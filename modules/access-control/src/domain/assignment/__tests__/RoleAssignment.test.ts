import { describe, it, expect } from 'vitest';
import { RoleAssignment } from '../RoleAssignment.js';
import { RoleAssignmentId } from '../RoleAssignmentId.js';

describe('RoleAssignment', () => {
  it('create() builds an active assignment with RoleAssignedEvent', () => {
    const result = RoleAssignment.create({
      userId: 'user-123',
      roleId: 'role-456',
      roleName: 'admin',
      assignedBy: 'user-789',
    });

    expect(result.isOk()).toBe(true);
    const assignment = (result as any).value;
    expect(assignment.userId).toBe('user-123');
    expect(assignment.roleId).toBe('role-456');
    expect(assignment.roleName).toBe('admin');
    expect(assignment.assignedBy).toBe('user-789');
    expect(assignment.tenantId).toBe(null);
    expect(assignment.expiresAt).toBe(null);
    expect(assignment.revokedAt).toBe(null);
    expect(assignment.revokedBy).toBe(null);
    expect(assignment.revokedReason).toBe(null);
    expect(assignment.isExpired).toBe(false);
    expect(assignment.version).toBe(1);

    const events = assignment.pullDomainEvents();
    expect(events.length).toBe(1);
    expect(events[0].eventName).toBe('access-control.role-assignment.assigned');
    expect((events[0] as any).userId).toBe('user-123');
    expect((events[0] as any).roleId).toBe('role-456');
    expect((events[0] as any).roleName).toBe('admin');
    expect((events[0] as any).assignedBy).toBe('user-789');
  });

  it('create() validates userId', () => {
    const result = RoleAssignment.create({
      userId: '',
      roleId: 'role-456',
      roleName: 'admin',
      assignedBy: 'user-789',
    });

    expect(result.isErr()).toBe(true);
    expect((result as any).error.code).toBe('ROLE_ASSIGNMENT_USER_EMPTY');
  });

  it('create() validates roleId', () => {
    const result = RoleAssignment.create({
      userId: 'user-123',
      roleId: '',
      roleName: 'admin',
      assignedBy: 'user-789',
    });

    expect(result.isErr()).toBe(true);
    expect((result as any).error.code).toBe('ROLE_ASSIGNMENT_ROLE_EMPTY');
  });

  it('create() validates roleName', () => {
    const result = RoleAssignment.create({
      userId: 'user-123',
      roleId: 'role-456',
      roleName: '',
      assignedBy: 'user-789',
    });

    expect(result.isErr()).toBe(true);
    expect((result as any).error.code).toBe('ROLE_ASSIGNMENT_ROLE_NAME_EMPTY');
  });

  it('create() normalizes roleName to lowercase', () => {
    const result = RoleAssignment.create({
      userId: 'user-123',
      roleId: 'role-456',
      roleName: 'ADMIN',
      assignedBy: 'user-789',
    });

    expect(result.isOk()).toBe(true);
    expect((result as any).value.roleName).toBe('admin');
  });

  it('create() validates assignedBy', () => {
    const result = RoleAssignment.create({
      userId: 'user-123',
      roleId: 'role-456',
      roleName: 'admin',
      assignedBy: '',
    });

    expect(result.isErr()).toBe(true);
    expect((result as any).error.code).toBe('ROLE_ASSIGNMENT_ASSIGNED_BY_EMPTY');
  });

  it('create() validates expiresAt is in future', () => {
    const past = new Date('2020-01-01');
    const result = RoleAssignment.create({
      userId: 'user-123',
      roleId: 'role-456',
      roleName: 'admin',
      assignedBy: 'user-789',
      expiresAt: past,
    });

    expect(result.isErr()).toBe(true);
    expect((result as any).error.code).toBe('ROLE_ASSIGNMENT_EXPIRES_IN_PAST');
  });

  it('create() accepts expiresAt in future', () => {
    const future = new Date('2030-01-01');
    const result = RoleAssignment.create({
      userId: 'user-123',
      roleId: 'role-456',
      roleName: 'admin',
      assignedBy: 'user-789',
      expiresAt: future,
    });

    expect(result.isOk()).toBe(true);
    expect((result as any).value.expiresAt?.toISOString()).toBe('2030-01-01T00:00:00.000Z');
  });

  it('create() accepts tenantId', () => {
    const result = RoleAssignment.create({
      userId: 'user-123',
      roleId: 'role-456',
      roleName: 'admin',
      assignedBy: 'user-789',
      tenantId: 'tenant-123',
    });

    expect(result.isOk()).toBe(true);
    expect((result as any).value.tenantId).toBe('tenant-123');
  });

  it('reconstruct() rebuilds from persistence', () => {
    const props = {
      id: new RoleAssignmentId(),
      userId: 'user-123',
      roleId: 'role-456',
      roleName: 'admin',
      tenantId: 'tenant-123',
      assignedBy: 'user-789',
      assignedAt: new Date('2024-01-01'),
      expiresAt: new Date('2030-01-01'),
      revokedAt: null,
      revokedBy: null,
      revokedReason: null,
      isExpired: false,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-02'),
      version: 5,
    };

    const assignment = RoleAssignment.reconstruct(props);

    expect(assignment.id.value).toBe(props.id.value);
    expect(assignment.userId).toBe('user-123');
    expect(assignment.roleId).toBe('role-456');
    expect(assignment.version).toBe(5);
  });

  it('revoke() marks as revoked and emits RoleRevokedEvent', () => {
    const assignment = RoleAssignment.create({
      userId: 'user-123',
      roleId: 'role-456',
      roleName: 'admin',
      assignedBy: 'user-789',
    }).getOrThrow();
    assignment.pullDomainEvents();

    const result = assignment.revoke('user-999', 'User left the company');

    expect(result.isOk()).toBe(true);
    expect(assignment.revokedAt !== null).toBe(true);
    expect(assignment.revokedBy).toBe('user-999');
    expect(assignment.revokedReason).toBe('User left the company');

    const events = assignment.pullDomainEvents();
    expect(events.length).toBe(1);
    expect(events[0].eventName).toBe('access-control.role-assignment.revoked');
    expect((events[0] as any).revokedBy).toBe('user-999');
    expect((events[0] as any).reason).toBe('User left the company');
  });

  it('revoke() rejects already revoked', () => {
    const assignment = RoleAssignment.create({
      userId: 'user-123',
      roleId: 'role-456',
      roleName: 'admin',
      assignedBy: 'user-789',
    }).getOrThrow();
    assignment.revoke('user-999');

    const result = assignment.revoke('user-999');

    expect(result.isErr()).toBe(true);
    expect((result as any).error.code).toBe('ROLE_ASSIGNMENT_ALREADY_REVOKED');
  });

  it('revoke() validates revokedBy', () => {
    const assignment = RoleAssignment.create({
      userId: 'user-123',
      roleId: 'role-456',
      roleName: 'admin',
      assignedBy: 'user-789',
    }).getOrThrow();

    const result = assignment.revoke('');

    expect(result.isErr()).toBe(true);
    expect((result as any).error.code).toBe('ROLE_ASSIGNMENT_REVOKED_BY_EMPTY');
  });

  it('revoke() validates reason length', () => {
    const assignment = RoleAssignment.create({
      userId: 'user-123',
      roleId: 'role-456',
      roleName: 'admin',
      assignedBy: 'user-789',
    }).getOrThrow();

    const result = assignment.revoke('user-999', 'a'.repeat(501));

    expect(result.isErr()).toBe(true);
    expect((result as any).error.code).toBe('ROLE_ASSIGNMENT_REASON_TOO_LONG');
  });

  it('revoke() accepts empty reason', () => {
    const assignment = RoleAssignment.create({
      userId: 'user-123',
      roleId: 'role-456',
      roleName: 'admin',
      assignedBy: 'user-789',
    }).getOrThrow();
    assignment.pullDomainEvents();

    const result = assignment.revoke('user-999', '');

    expect(result.isOk()).toBe(true);
    expect(assignment.revokedReason).toBe(null);
  });

  it('revoke() trims reason', () => {
    const assignment = RoleAssignment.create({
      userId: 'user-123',
      roleId: 'role-456',
      roleName: 'admin',
      assignedBy: 'user-789',
    }).getOrThrow();
    assignment.pullDomainEvents();

    const result = assignment.revoke('user-999', '  reason  ');

    expect(result.isOk()).toBe(true);
    expect(assignment.revokedReason).toBe('reason');
  });

  it('markExpired() marks as expired and emits RoleAssignmentExpiredEvent', () => {
    const future = new Date('2030-01-01');
    const assignment = RoleAssignment.create({
      userId: 'user-123',
      roleId: 'role-456',
      roleName: 'admin',
      assignedBy: 'user-789',
      expiresAt: future,
    }).getOrThrow();
    assignment.pullDomainEvents();

    // Reconstruct with past expiresAt to test markExpired
    const pastAssignment = RoleAssignment.reconstruct({
      id: assignment.id,
      userId: assignment.userId,
      roleId: assignment.roleId,
      roleName: assignment.roleName,
      tenantId: assignment.tenantId,
      assignedBy: assignment.assignedBy,
      assignedAt: assignment.assignedAt,
      expiresAt: new Date('2020-01-01'),
      revokedAt: null,
      revokedBy: null,
      revokedReason: null,
      isExpired: false,
      createdAt: assignment.createdAt,
      updatedAt: assignment.updatedAt,
      version: assignment.version,
    });

    const result = pastAssignment.markExpired();

    expect(result.isOk()).toBe(true);
    expect(pastAssignment.isExpired).toBe(true);

    const events = pastAssignment.pullDomainEvents();
    expect(events.length).toBe(1);
    expect(events[0].eventName).toBe('access-control.role-assignment.expired');
  });

  it('markExpired() rejects revoked assignment', () => {
    const assignment = RoleAssignment.create({
      userId: 'user-123',
      roleId: 'role-456',
      roleName: 'admin',
      assignedBy: 'user-789',
    }).getOrThrow();
    assignment.revoke('user-999');

    const result = assignment.markExpired();

    expect(result.isErr()).toBe(true);
    expect((result as any).error.code).toBe('ROLE_ASSIGNMENT_REVOKED');
  });

  it('markExpired() rejects already expired', () => {
    const future = new Date('2030-01-01');
    const assignment = RoleAssignment.create({
      userId: 'user-123',
      roleId: 'role-456',
      roleName: 'admin',
      assignedBy: 'user-789',
      expiresAt: future,
    }).getOrThrow();

    // Reconstruct with past expiresAt and isExpired flag
    const pastAssignment = RoleAssignment.reconstruct({
      id: assignment.id,
      userId: assignment.userId,
      roleId: assignment.roleId,
      roleName: assignment.roleName,
      tenantId: assignment.tenantId,
      assignedBy: assignment.assignedBy,
      assignedAt: assignment.assignedAt,
      expiresAt: new Date('2020-01-01'),
      revokedAt: null,
      revokedBy: null,
      revokedReason: null,
      isExpired: true,
      createdAt: assignment.createdAt,
      updatedAt: assignment.updatedAt,
      version: assignment.version,
    });

    const result = pastAssignment.markExpired();

    expect(result.isErr()).toBe(true);
    expect((result as any).error.code).toBe('ROLE_ASSIGNMENT_ALREADY_EXPIRED');
  });

  it('markExpired() rejects assignment without expiresAt', () => {
    const assignment = RoleAssignment.create({
      userId: 'user-123',
      roleId: 'role-456',
      roleName: 'admin',
      assignedBy: 'user-789',
    }).getOrThrow();

    const result = assignment.markExpired();

    expect(result.isErr()).toBe(true);
    expect((result as any).error.code).toBe('ROLE_ASSIGNMENT_NEVER_EXPIRES');
  });

  it('markExpired() rejects assignment not yet expired', () => {
    const future = new Date('2030-01-01');
    const assignment = RoleAssignment.create({
      userId: 'user-123',
      roleId: 'role-456',
      roleName: 'admin',
      assignedBy: 'user-789',
      expiresAt: future,
    }).getOrThrow();

    const result = assignment.markExpired();

    expect(result.isErr()).toBe(true);
    expect((result as any).error.code).toBe('ROLE_ASSIGNMENT_NOT_YET_EXPIRED');
  });

  it('isExpiredAt() returns false when no expiresAt', () => {
    const assignment = RoleAssignment.create({
      userId: 'user-123',
      roleId: 'role-456',
      roleName: 'admin',
      assignedBy: 'user-789',
    }).getOrThrow();

    expect(assignment.isExpiredAt()).toBe(false);
  });

  it('isExpiredAt() returns false when expiresAt in future', () => {
    const future = new Date('2030-01-01');
    const assignment = RoleAssignment.create({
      userId: 'user-123',
      roleId: 'role-456',
      roleName: 'admin',
      assignedBy: 'user-789',
      expiresAt: future,
    }).getOrThrow();

    expect(assignment.isExpiredAt()).toBe(false);
  });

  it('isExpiredAt() returns true when expiresAt in past', () => {
    const future = new Date('2030-01-01');
    const assignment = RoleAssignment.create({
      userId: 'user-123',
      roleId: 'role-456',
      roleName: 'admin',
      assignedBy: 'user-789',
      expiresAt: future,
    }).getOrThrow();

    // Reconstruct with past expiresAt
    const pastAssignment = RoleAssignment.reconstruct({
      id: assignment.id,
      userId: assignment.userId,
      roleId: assignment.roleId,
      roleName: assignment.roleName,
      tenantId: assignment.tenantId,
      assignedBy: assignment.assignedBy,
      assignedAt: assignment.assignedAt,
      expiresAt: new Date('2020-01-01'),
      revokedAt: null,
      revokedBy: null,
      revokedReason: null,
      isExpired: false,
      createdAt: assignment.createdAt,
      updatedAt: assignment.updatedAt,
      version: assignment.version,
    });

    expect(pastAssignment.isExpiredAt()).toBe(true);
  });

  it('isExpiredAt() accepts custom clock', () => {
    const future = new Date('2030-01-01');
    const assignment = RoleAssignment.create({
      userId: 'user-123',
      roleId: 'role-456',
      roleName: 'admin',
      assignedBy: 'user-789',
      expiresAt: future,
    }).getOrThrow();

    expect(assignment.isExpiredAt()).toBe(false);
    expect(assignment.isExpiredAt(new Date('2035-01-01'))).toBe(true);
  });

  it('isActive() returns true for active assignment', () => {
    const assignment = RoleAssignment.create({
      userId: 'user-123',
      roleId: 'role-456',
      roleName: 'admin',
      assignedBy: 'user-789',
    }).getOrThrow();

    expect(assignment.isActive()).toBe(true);
  });

  it('isActive() returns false for revoked assignment', () => {
    const assignment = RoleAssignment.create({
      userId: 'user-123',
      roleId: 'role-456',
      roleName: 'admin',
      assignedBy: 'user-789',
    }).getOrThrow();
    assignment.revoke('user-999');

    expect(assignment.isActive()).toBe(false);
  });

  it('isActive() returns false for expired assignment (persisted)', () => {
    const future = new Date('2030-01-01');
    const assignment = RoleAssignment.create({
      userId: 'user-123',
      roleId: 'role-456',
      roleName: 'admin',
      assignedBy: 'user-789',
      expiresAt: future,
    }).getOrThrow();

    // Reconstruct with past expiresAt and isExpired flag
    const pastAssignment = RoleAssignment.reconstruct({
      id: assignment.id,
      userId: assignment.userId,
      roleId: assignment.roleId,
      roleName: assignment.roleName,
      tenantId: assignment.tenantId,
      assignedBy: assignment.assignedBy,
      assignedAt: assignment.assignedAt,
      expiresAt: new Date('2020-01-01'),
      revokedAt: null,
      revokedBy: null,
      revokedReason: null,
      isExpired: true,
      createdAt: assignment.createdAt,
      updatedAt: assignment.updatedAt,
      version: assignment.version,
    });

    expect(pastAssignment.isActive()).toBe(false);
  });

  it('isActive() returns false for expired assignment (detected)', () => {
    const future = new Date('2030-01-01');
    const assignment = RoleAssignment.create({
      userId: 'user-123',
      roleId: 'role-456',
      roleName: 'admin',
      assignedBy: 'user-789',
      expiresAt: future,
    }).getOrThrow();

    // Reconstruct with past expiresAt
    const pastAssignment = RoleAssignment.reconstruct({
      id: assignment.id,
      userId: assignment.userId,
      roleId: assignment.roleId,
      roleName: assignment.roleName,
      tenantId: assignment.tenantId,
      assignedBy: assignment.assignedBy,
      assignedAt: assignment.assignedAt,
      expiresAt: new Date('2020-01-01'),
      revokedAt: null,
      revokedBy: null,
      revokedReason: null,
      isExpired: false,
      createdAt: assignment.createdAt,
      updatedAt: assignment.updatedAt,
      version: assignment.version,
    });

    expect(pastAssignment.isActive()).toBe(false);
  });

  it('isActive() accepts custom clock', () => {
    const future = new Date('2030-01-01');
    const assignment = RoleAssignment.create({
      userId: 'user-123',
      roleId: 'role-456',
      roleName: 'admin',
      assignedBy: 'user-789',
      expiresAt: future,
    }).getOrThrow();

    expect(assignment.isActive()).toBe(true);
    expect(assignment.isActive(new Date('2035-01-01'))).toBe(false);
  });
});
