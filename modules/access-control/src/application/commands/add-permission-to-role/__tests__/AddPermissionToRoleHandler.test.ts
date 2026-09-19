import { describe, it, expect, vi } from 'vitest';
import { ok } from '@workspace/kernel';
import { AddPermissionToRoleHandler, type AddPermissionToRoleResult } from '../AddPermissionToRoleHandler.js';
import type { AddPermissionToRoleCommand } from '../AddPermissionToRoleCommand.js';
import type { AccessControlUnitOfWork } from '../../../ports/AccessControlUnitOfWork.js';
import type { RoleRepository } from '../../../../domain/role/RoleRepository.js';
import type { OutboxPort } from '../../../ports/OutboxPort.js';

describe('AddPermissionToRoleHandler', () => {
  it('adds permission to role successfully', async () => {
    const role = {
      id: { value: 'role-123' },
      permissionNames: vi.fn().mockReturnValue(['tenant:create', 'tenant:read']),
      updatedAt: new Date(),
      addPermission: vi.fn().mockReturnValue(ok(undefined)),
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

    const handler = new AddPermissionToRoleHandler(mockUow);

    const command: AddPermissionToRoleCommand = {
      roleId: 'role-123',
      permissionName: 'tenant:delete',
      actorId: 'user-123',
    };

    const result = await handler.execute(command);

    expect(result.isOk()).toBe(true);
    const addResult = (result as any).value as AddPermissionToRoleResult;
    expect(addResult.roleId).toBe('role-123');
    expect(addResult.permissionNames).toEqual(['tenant:create', 'tenant:read']);

    expect(mockRoleRepo.findById).toHaveBeenCalled();
    expect(role.addPermission).toHaveBeenCalled();
    expect(mockRoleRepo.save).toHaveBeenCalled();
    expect(mockOutbox.enqueueAll).toHaveBeenCalled();
  });

  it('validates empty roleId', async () => {
    const mockUow = {
      roles: { findById: vi.fn() },
      outbox: { enqueueAll: vi.fn() },
      withTransaction: vi.fn(),
    } as unknown as AccessControlUnitOfWork;

    const handler = new AddPermissionToRoleHandler(mockUow);

    const command: AddPermissionToRoleCommand = {
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

    const handler = new AddPermissionToRoleHandler(mockUow);

    const command: AddPermissionToRoleCommand = {
      roleId: 'role-123',
      permissionName: 'tenant:create',
      actorId: '',
    };

    const result = await handler.execute(command);

    expect(result.isErr()).toBe(true);
    expect((result as any).error.code).toBe('ACTOR_REQUIRED');
  });

  it('validates permission name format', async () => {
    const mockUow = {
      roles: { findById: vi.fn() },
      outbox: { enqueueAll: vi.fn() },
      withTransaction: vi.fn(),
    } as unknown as AccessControlUnitOfWork;

    const handler = new AddPermissionToRoleHandler(mockUow);

    const command: AddPermissionToRoleCommand = {
      roleId: 'role-123',
      permissionName: 'invalid-format',
      actorId: 'user-123',
    };

    const result = await handler.execute(command);

    expect(result.isErr()).toBe(true);
    expect((result as any).error.code).toBe('VALIDATION_ERROR');
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

    const handler = new AddPermissionToRoleHandler(mockUow);

    const command: AddPermissionToRoleCommand = {
      roleId: 'role-123',
      permissionName: 'tenant:create',
      actorId: 'user-123',
    };

    const result = await handler.execute(command);

    expect(result.isErr()).toBe(true);
    expect((result as any).error.code).toBe('ROLE_NOT_FOUND');
  });

  it('rejects duplicate permission', async () => {
    const role = {
      id: { value: 'role-123' },
      addPermission: vi.fn().mockReturnValue({ isErr: () => true, error: { code: 'ROLE_PERMISSION_DUPLICATE' } }),
    } as any;

    const mockRoleRepo = {
      findById: vi.fn().mockResolvedValue(role),
    } as unknown as RoleRepository;

    const mockUow = {
      roles: mockRoleRepo,
      outbox: { enqueueAll: vi.fn() },
      withTransaction: vi.fn(),
    } as unknown as AccessControlUnitOfWork;

    const handler = new AddPermissionToRoleHandler(mockUow);

    const command: AddPermissionToRoleCommand = {
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
      addPermission: vi.fn().mockReturnValue({ isErr: () => true, error: { code: 'ROLE_SYSTEM_IMMUTABLE' } }),
    } as any;

    const mockRoleRepo = {
      findById: vi.fn().mockResolvedValue(role),
    } as unknown as RoleRepository;

    const mockUow = {
      roles: mockRoleRepo,
      outbox: { enqueueAll: vi.fn() },
      withTransaction: vi.fn(),
    } as unknown as AccessControlUnitOfWork;

    const handler = new AddPermissionToRoleHandler(mockUow);

    const command: AddPermissionToRoleCommand = {
      roleId: 'role-123',
      permissionName: 'tenant:create',
      actorId: 'user-123',
    };

    const result = await handler.execute(command);

    expect(result.isErr()).toBe(true);
    expect((result as any).error.code).toBe('VALIDATION_ERROR');
  });
});
