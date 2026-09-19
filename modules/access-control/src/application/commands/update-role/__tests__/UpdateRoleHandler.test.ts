import { describe, it, expect, vi } from 'vitest';
import { ok } from '@workspace/kernel';
import { UpdateRoleHandler, type UpdateRoleResult } from '../UpdateRoleHandler.js';
import type { UpdateRoleCommand } from '../UpdateRoleCommand.js';
import type { AccessControlUnitOfWork } from '../../../ports/AccessControlUnitOfWork.js';
import type { RoleRepository } from '../../../../domain/role/RoleRepository.js';
import type { OutboxPort } from '../../../ports/OutboxPort.js';

describe('UpdateRoleHandler', () => {
  it('updates role name successfully', async () => {
    const role = {
      id: { value: 'role-123' },
      name: { value: 'admin' },
      description: 'Old desc',
      permissionNames: vi.fn().mockReturnValue([]),
      isSystem: false,
      tenantId: null,
      updatedAt: new Date(),
      rename: vi.fn().mockImplementation(() => {
        role.name.value = 'superadmin';
        return ok(undefined);
      }),
      updateDescription: vi.fn().mockReturnValue(ok(undefined)),
      pullDomainEvents: vi.fn().mockReturnValue([]),
    } as any;

    const mockRoleRepo = {
      findById: vi.fn().mockResolvedValue(role),
      existsByName: vi.fn().mockResolvedValue(false),
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

    const handler = new UpdateRoleHandler(mockUow);

    const command: UpdateRoleCommand = {
      roleId: 'role-123',
      name: 'superadmin',
      actorId: 'user-123',
    };

    const result = await handler.execute(command);

    expect(result.isOk()).toBe(true);
    const roleResult = (result as any).value as UpdateRoleResult;
    expect(roleResult.name).toBe('superadmin');
    expect(roleResult.description).toBe('Old desc');

    expect(mockRoleRepo.findById).toHaveBeenCalled();
    expect(mockRoleRepo.existsByName).toHaveBeenCalledWith('superadmin', 'role-123');
    expect(mockRoleRepo.save).toHaveBeenCalled();
    expect(mockOutbox.enqueueAll).toHaveBeenCalled();
  });

  it('updates role description successfully', async () => {
    const role = {
      id: { value: 'role-123' },
      name: { value: 'admin' },
      description: 'Old desc',
      permissionNames: vi.fn().mockReturnValue([]),
      isSystem: false,
      tenantId: null,
      updatedAt: new Date(),
      rename: vi.fn().mockReturnValue(ok(undefined)),
      updateDescription: vi.fn().mockImplementation(() => {
        role.description = 'New description';
        return ok(undefined);
      }),
      pullDomainEvents: vi.fn().mockReturnValue([]),
    } as any;

    const mockRoleRepo = {
      findById: vi.fn().mockResolvedValue(role),
      existsByName: vi.fn().mockResolvedValue(false),
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

    const handler = new UpdateRoleHandler(mockUow);

    const command: UpdateRoleCommand = {
      roleId: 'role-123',
      description: 'New description',
      actorId: 'user-123',
    };

    const result = await handler.execute(command);

    expect(result.isOk()).toBe(true);
    const roleResult = (result as any).value as UpdateRoleResult;
    expect(roleResult.name).toBe('admin');
    expect(roleResult.description).toBe('New description');

    expect(mockRoleRepo.save).toHaveBeenCalled();
    expect(mockOutbox.enqueueAll).toHaveBeenCalled();
  });

  it('validates empty roleId', async () => {
    const mockUow = {
      roles: { findById: vi.fn() },
      outbox: { enqueueAll: vi.fn() },
      withTransaction: vi.fn(),
    } as unknown as AccessControlUnitOfWork;

    const handler = new UpdateRoleHandler(mockUow);

    const command: UpdateRoleCommand = {
      roleId: '',
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

    const handler = new UpdateRoleHandler(mockUow);

    const command: UpdateRoleCommand = {
      roleId: 'role-123',
      actorId: '',
    };

    const result = await handler.execute(command);

    expect(result.isErr()).toBe(true);
    expect((result as any).error.code).toBe('ACTOR_REQUIRED');
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

    const handler = new UpdateRoleHandler(mockUow);

    const command: UpdateRoleCommand = {
      roleId: 'role-123',
      actorId: 'user-123',
    };

    const result = await handler.execute(command);

    expect(result.isErr()).toBe(true);
    expect((result as any).error.code).toBe('ROLE_NOT_FOUND');
  });

  it('validates role name format', async () => {
    const role = {
      id: { value: 'role-123' },
      rename: vi.fn(),
      updateDescription: vi.fn(),
    } as any;

    const mockRoleRepo = {
      findById: vi.fn().mockResolvedValue(role),
    } as unknown as RoleRepository;

    const mockUow = {
      roles: mockRoleRepo,
      outbox: { enqueueAll: vi.fn() },
      withTransaction: vi.fn(),
    } as unknown as AccessControlUnitOfWork;

    const handler = new UpdateRoleHandler(mockUow);

    const command: UpdateRoleCommand = {
      roleId: 'role-123',
      name: '',
      actorId: 'user-123',
    };

    const result = await handler.execute(command);

    expect(result.isErr()).toBe(true);
    expect((result as any).error.code).toBe('VALIDATION_ERROR');
  });

  it('validates duplicate role name', async () => {
    const role = {
      id: { value: 'role-123' },
      rename: vi.fn(),
      updateDescription: vi.fn(),
    } as any;

    const mockRoleRepo = {
      findById: vi.fn().mockResolvedValue(role),
      existsByName: vi.fn().mockResolvedValue(true),
    } as unknown as RoleRepository;

    const mockUow = {
      roles: mockRoleRepo,
      outbox: { enqueueAll: vi.fn() },
      withTransaction: vi.fn(),
    } as unknown as AccessControlUnitOfWork;

    const handler = new UpdateRoleHandler(mockUow);

    const command: UpdateRoleCommand = {
      roleId: 'role-123',
      name: 'existing-role',
      actorId: 'user-123',
    };

    const result = await handler.execute(command);

    expect(result.isErr()).toBe(true);
    expect((result as any).error.code).toBe('ROLE_NAME_TAKEN');
  });

  it('validates description length', async () => {
    const role = {
      id: { value: 'role-123' },
      rename: vi.fn(),
      updateDescription: vi.fn().mockReturnValue({ isErr: () => true, error: { code: 'ROLE_DESCRIPTION_TOO_LONG' } }),
    } as any;

    const mockRoleRepo = {
      findById: vi.fn().mockResolvedValue(role),
    } as unknown as RoleRepository;

    const mockUow = {
      roles: mockRoleRepo,
      outbox: { enqueueAll: vi.fn() },
      withTransaction: vi.fn(),
    } as unknown as AccessControlUnitOfWork;

    const handler = new UpdateRoleHandler(mockUow);

    const command: UpdateRoleCommand = {
      roleId: 'role-123',
      description: 'a'.repeat(501),
      actorId: 'user-123',
    };

    const result = await handler.execute(command);

    expect(result.isErr()).toBe(true);
    expect((result as any).error.code).toBe('VALIDATION_ERROR');
  });

  it('normalizes role name to lowercase', async () => {
    const role = {
      id: { value: 'role-123' },
      name: { value: 'admin' },
      description: '',
      permissionNames: vi.fn().mockReturnValue([]),
      isSystem: false,
      tenantId: null,
      updatedAt: new Date(),
      rename: vi.fn().mockImplementation(() => {
        role.name.value = 'superadmin';
        return ok(undefined);
      }),
      updateDescription: vi.fn().mockReturnValue(ok(undefined)),
      pullDomainEvents: vi.fn().mockReturnValue([]),
    } as any;

    const mockRoleRepo = {
      findById: vi.fn().mockResolvedValue(role),
      existsByName: vi.fn().mockResolvedValue(false),
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

    const handler = new UpdateRoleHandler(mockUow);

    const command: UpdateRoleCommand = {
      roleId: 'role-123',
      name: 'SUPERADMIN',
      actorId: 'user-123',
    };

    const result = await handler.execute(command);

    expect(result.isOk()).toBe(true);
    const roleResult = (result as any).value as UpdateRoleResult;
    expect(roleResult.name).toBe('superadmin');
  });

  it('handles no-op when name unchanged', async () => {
    const role = {
      id: { value: 'role-123' },
      rename: vi.fn().mockReturnValue({ isErr: () => true, error: { code: 'ROLE_NAME_UNCHANGED' } }),
      updateDescription: vi.fn(),
    } as any;

    const mockRoleRepo = {
      findById: vi.fn().mockResolvedValue(role),
      existsByName: vi.fn().mockResolvedValue(false),
    } as unknown as RoleRepository;

    const mockUow = {
      roles: mockRoleRepo,
      outbox: { enqueueAll: vi.fn() },
      withTransaction: vi.fn(),
    } as unknown as AccessControlUnitOfWork;

    const handler = new UpdateRoleHandler(mockUow);

    const command: UpdateRoleCommand = {
      roleId: 'role-123',
      name: 'admin',
      actorId: 'user-123',
    };

    const result = await handler.execute(command);

    expect(result.isErr()).toBe(true);
    expect((result as any).error.code).toBe('VALIDATION_ERROR');
  });
});
