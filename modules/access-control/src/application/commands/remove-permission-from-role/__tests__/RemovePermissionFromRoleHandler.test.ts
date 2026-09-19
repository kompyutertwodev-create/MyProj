import { describe, it, expect, vi } from 'vitest';
import { ok } from '@workspace/kernel';
import { RemovePermissionFromRoleHandler, type RemovePermissionFromRoleResult } from '../RemovePermissionFromRoleHandler.js';
import type { RemovePermissionFromRoleCommand } from '../RemovePermissionFromRoleCommand.js';
import type { AccessControlUnitOfWork } from '../../../ports/AccessControlUnitOfWork.js';
import type { RoleRepository } from '../../../../domain/role/RoleRepository.js';
import type { OutboxPort } from '../../../ports/OutboxPort.js';

describe('RemovePermissionFromRoleHandler', () => {
  it('removes permission from role successfully', async () => {
    const role = {
      id: { value: 'role-123' },
      permissionNames: vi.fn().mockReturnValue(['tenant:create']),
      updatedAt: new Date(),
      removePermission: vi.fn().mockReturnValue(ok(undefined)),
      pullDomainEvents: vi.fn().mockReturnValue([]),
    } as any;

    const mockRoleRepo = {
      findById: vi.fn().mockResolvedValue(role),
      save: vi.fn().mockResolvedValue(undefined),
    } as unknown as RoleRepository;

    const mockOutbox = {
      enqueueAll: vi.fn().mockResolvedValue(undefined),
    } as unknown as OutboxPort;

    const mockUow = {
      roles: mockRoleRepo,
      outbox: mockOutbox,
      withTransaction: vi.fn().mockImplementation(async (callback) => {
        await callback({ roles: mockRoleRepo, outbox: mockOutbox });
      }),
    } as unknown as AccessControlUnitOfWork;

    const handler = new RemovePermissionFromRoleHandler(mockUow);

    const command: RemovePermissionFromRoleCommand = {
      roleId: 'role-123',
      permissionName: 'tenant:read',
      actorId: 'user-123',
    };

    const result = await handler.execute(command);

    expect(result.isOk()).toBe(true);
    const removeResult = (result as any).value as RemovePermissionFromRoleResult;
    expect(removeResult.roleId).toBe('role-123');
    expect(removeResult.permissionNames).toEqual(['tenant:create']);

    expect(mockRoleRepo.findById).toHaveBeenCalled();
    expect(role.removePermission).toHaveBeenCalledWith('tenant:read');
    expect(mockRoleRepo.save).toHaveBeenCalled();
    expect(mockOutbox.enqueueAll).toHaveBeenCalled();
  });

  it('validates empty roleId', async () => {
    const mockUow = {
      roles: { findById: vi.fn() },
      outbox: { enqueueAll: vi.fn() },
      withTransaction: vi.fn(),
    } as unknown as AccessControlUnitOfWork;

    const handler = new RemovePermissionFromRoleHandler(mockUow);

    const command: RemovePermissionFromRoleCommand = {
      roleId: '',
      permissionName: 'tenant:create',
      actorId: 'user-123',
    };

    const result = await handler.execute(command);

    expect(result.isErr()).toBe(true);
    expect((result as any).error.code).toBe('ROLE_ID_REQUIRED');
  });

  it('validates empty actorId', async () => {
    const mockUow = {
      roles: { findById: vi.fn() },
      outbox: { enqueueAll: vi.fn() },
      withTransaction: vi.fn(),
    } as unknown as AccessControlUnitOfWork;

    const handler = new RemovePermissionFromRoleHandler(mockUow);

    const command: RemovePermissionFromRoleCommand = {
      roleId: 'role-123',
      permissionName: 'tenant:create',
      actorId: '',
    };

    const result = await handler.execute(command);

    expect(result.isErr()).toBe(true);
    expect((result as any).error.code).toBe('ACTOR_REQUIRED');
  });

  it('validates empty permissionName', async () => {
    const mockUow = {
      roles: { findById: vi.fn() },
      outbox: { enqueueAll: vi.fn() },
      withTransaction: vi.fn(),
    } as unknown as AccessControlUnitOfWork;

    const handler = new RemovePermissionFromRoleHandler(mockUow);

    const command: RemovePermissionFromRoleCommand = {
      roleId: 'role-123',
      permissionName: '',
      actorId: 'user-123',
    };

    const result = await handler.execute(command);

    expect(result.isErr()).toBe(true);
    expect((result as any).error.code).toBe('PERMISSION_NAME_REQUIRED');
  });

  it('returns not found when role does not exist', async () => {
    const mockRoleRepo = {
      findById: vi.fn().mockResolvedValue(null),
    } as unknown as RoleRepository;

    const mockUow = {
      roles: mockRoleRepo,
      outbox: { enqueueAll: vi.fn() },
      withTransaction: vi.fn(),
    } as unknown as AccessControlUnitOfWork;

    const handler = new RemovePermissionFromRoleHandler(mockUow);

    const command: RemovePermissionFromRoleCommand = {
      roleId: 'role-123',
      permissionName: 'tenant:create',
      actorId: 'user-123',
    };

    const result = await handler.execute(command);

    expect(result.isErr()).toBe(true);
    expect((result as any).error.code).toBe('ROLE_NOT_FOUND');
  });

  it('rejects missing permission', async () => {
    const role = {
      id: { value: 'role-123' },
      removePermission: vi.fn().mockReturnValue({ isErr: () => true, error: { code: 'ROLE_PERMISSION_MISSING' } }),
    } as any;

    const mockRoleRepo = {
      findById: vi.fn().mockResolvedValue(role),
    } as unknown as RoleRepository;

    const mockUow = {
      roles: mockRoleRepo,
      outbox: { enqueueAll: vi.fn() },
      withTransaction: vi.fn(),
    } as unknown as AccessControlUnitOfWork;

    const handler = new RemovePermissionFromRoleHandler(mockUow);

    const command: RemovePermissionFromRoleCommand = {
      roleId: 'role-123',
      permissionName: 'tenant:create',
      actorId: 'user-123',
    };

    const result = await handler.execute(command);

    expect(result.isErr()).toBe(true);
    expect((result as any).error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects system role mutation', async () => {
    const role = {
      id: { value: 'role-123' },
      removePermission: vi.fn().mockReturnValue({ isErr: () => true, error: { code: 'ROLE_SYSTEM_IMMUTABLE' } }),
    } as any;

    const mockRoleRepo = {
      findById: vi.fn().mockResolvedValue(role),
    } as unknown as RoleRepository;

    const mockUow = {
      roles: mockRoleRepo,
      outbox: { enqueueAll: vi.fn() },
      withTransaction: vi.fn(),
    } as unknown as AccessControlUnitOfWork;

    const handler = new RemovePermissionFromRoleHandler(mockUow);

    const command: RemovePermissionFromRoleCommand = {
      roleId: 'role-123',
      permissionName: 'tenant:create',
      actorId: 'user-123',
    };

    const result = await handler.execute(command);

    expect(result.isErr()).toBe(true);
    expect((result as any).error.code).toBe('VALIDATION_ERROR');
  });
});
