import { describe, it, expect, vi } from 'vitest';
import { CreateRoleHandler, type CreateRoleResult } from '../CreateRoleHandler.js';
import type { CreateRoleCommand } from '../CreateRoleCommand.js';
import type { AccessControlUnitOfWork } from '../../ports/AccessControlUnitOfWork.js';
import type { RoleRepository } from '../../../domain/role/RoleRepository.js';
import type { OutboxPort } from '../../ports/OutboxPort.js';

describe('CreateRoleHandler', () => {
  it('creates a role successfully', async () => {
    const mockRoleRepo = {
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

    const handler = new CreateRoleHandler(mockUow);

    const command: CreateRoleCommand = {
      name: 'admin',
      description: 'Administrator role',
      permissionNames: ['tenant:create', 'tenant:read'],
      actorId: 'user-123',
    };

    const result = await handler.execute(command);

    expect(result.isOk()).toBe(true);
    const roleResult = (result as any).value as CreateRoleResult;
    expect(roleResult.name).toBe('admin');
    expect(roleResult.description).toBe('Administrator role');
    expect(roleResult.permissionNames).toEqual(['tenant:create', 'tenant:read']);
    expect(roleResult.isSystem).toBe(false);
    expect(roleResult.tenantId).toBe(null);

    expect(mockRoleRepo.existsByName).toHaveBeenCalledWith('admin');
    expect(mockRoleRepo.save).toHaveBeenCalled();
    expect(mockOutbox.enqueueAll).toHaveBeenCalled();
  });

  it('validates empty name', async () => {
    const mockUow = {
      roles: { existsByName: vi.fn().mockResolvedValue(false) },
      outbox: { enqueueAll: vi.fn().mockResolvedValue(undefined) },
      withTransaction: vi.fn().mockImplementation(async (callback) => {
        await callback(mockUow);
      }),
    } as unknown as AccessControlUnitOfWork;

    const handler = new CreateRoleHandler(mockUow);

    const command: CreateRoleCommand = {
      name: '',
      actorId: 'user-123',
    };

    const result = await handler.execute(command);

    expect(result.isErr()).toBe(true);
    expect((result as any).error.code).toBe('VALIDATION_ERROR');
  });

  it('validates empty actorId', async () => {
    const mockUow = {
      roles: { existsByName: vi.fn().mockResolvedValue(false) },
      outbox: { enqueueAll: vi.fn().mockResolvedValue(undefined) },
      withTransaction: vi.fn().mockImplementation(async (callback) => {
        await callback(mockUow);
      }),
    } as unknown as AccessControlUnitOfWork;

    const handler = new CreateRoleHandler(mockUow);

    const command: CreateRoleCommand = {
      name: 'admin',
      actorId: '',
    };

    const result = await handler.execute(command);

    expect(result.isErr()).toBe(true);
    expect((result as any).error.code).toBe('ACTOR_REQUIRED');
  });

  it('validates duplicate role name', async () => {
    const mockUow = {
      roles: { existsByName: vi.fn().mockResolvedValue(true) },
      outbox: { enqueueAll: vi.fn().mockResolvedValue(undefined) },
      withTransaction: vi.fn().mockImplementation(async (callback) => {
        await callback(mockUow);
      }),
    } as unknown as AccessControlUnitOfWork;

    const handler = new CreateRoleHandler(mockUow);

    const command: CreateRoleCommand = {
      name: 'admin',
      actorId: 'user-123',
    };

    const result = await handler.execute(command);

    expect(result.isErr()).toBe(true);
    expect((result as any).error.code).toBe('ROLE_NAME_TAKEN');
    expect((result as any).error.message).toContain('already exists');
  });

  it('validates invalid permission format', async () => {
    const mockUow = {
      roles: { existsByName: vi.fn().mockResolvedValue(false) },
      outbox: { enqueueAll: vi.fn().mockResolvedValue(undefined) },
      withTransaction: vi.fn().mockImplementation(async (callback) => {
        await callback(mockUow);
      }),
    } as unknown as AccessControlUnitOfWork;

    const handler = new CreateRoleHandler(mockUow);

    const command: CreateRoleCommand = {
      name: 'admin',
      permissionNames: ['invalid-format'],
      actorId: 'user-123',
    };

    const result = await handler.execute(command);

    expect(result.isErr()).toBe(true);
    expect((result as any).error.code).toBe('VALIDATION_ERROR');
  });

  it('normalizes permission names', async () => {
    const mockRoleRepo = {
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

    const handler = new CreateRoleHandler(mockUow);

    const command: CreateRoleCommand = {
      name: 'admin',
      permissionNames: [' tenant:create ', 'tenant:create', 'tenant:read'],
      actorId: 'user-123',
    };

    const result = await handler.execute(command);

    expect(result.isOk()).toBe(true);
    const roleResult = (result as any).value as CreateRoleResult;
    expect(roleResult.permissionNames).toEqual(['tenant:create', 'tenant:read']);
  });

  it('creates system role when specified', async () => {
    const mockRoleRepo = {
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

    const handler = new CreateRoleHandler(mockUow);

    const command: CreateRoleCommand = {
      name: 'admin',
      isSystem: true,
      actorId: 'user-123',
    };

    const result = await handler.execute(command);

    expect(result.isOk()).toBe(true);
    const roleResult = (result as any).value as CreateRoleResult;
    expect(roleResult.isSystem).toBe(true);
  });

  it('accepts tenantId', async () => {
    const mockRoleRepo = {
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

    const handler = new CreateRoleHandler(mockUow);

    const command: CreateRoleCommand = {
      name: 'admin',
      tenantId: 'tenant-123',
      actorId: 'user-123',
    };

    const result = await handler.execute(command);

    expect(result.isOk()).toBe(true);
    const roleResult = (result as any).value as CreateRoleResult;
    expect(roleResult.tenantId).toBe('tenant-123');
  });

  it('accepts custom roleId', async () => {
    const mockRoleRepo = {
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

    const handler = new CreateRoleHandler(mockUow);

    const command: CreateRoleCommand = {
      name: 'admin',
      roleId: 'custom-role-id',
      actorId: 'user-123',
    };

    const result = await handler.execute(command);

    expect(result.isOk()).toBe(true);
    const roleResult = (result as any).value as CreateRoleResult;
    expect(roleResult.id).toBe('custom-role-id');
  });

  it('normalizes role name to lowercase', async () => {
    const mockRoleRepo = {
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

    const handler = new CreateRoleHandler(mockUow);

    const command: CreateRoleCommand = {
      name: 'ADMIN',
      actorId: 'user-123',
    };

    const result = await handler.execute(command);

    expect(result.isOk()).toBe(true);
    const roleResult = (result as any).value as CreateRoleResult;
    expect(roleResult.name).toBe('admin');
  });
});
