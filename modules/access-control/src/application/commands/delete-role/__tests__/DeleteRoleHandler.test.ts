import { describe, it, expect, vi } from 'vitest';
import { ok } from '@workspace/kernel';
import { DeleteRoleHandler, type DeleteRoleResult } from '../DeleteRoleHandler.js';
import type { DeleteRoleCommand } from '../DeleteRoleCommand.js';
import type { AccessControlUnitOfWork } from '../../ports/AccessControlUnitOfWork.js';
import type { RoleRepository } from '../../../domain/role/RoleRepository.js';
import type { OutboxPort } from '../../ports/OutboxPort.js';

describe('DeleteRoleHandler', () => {
  it('deletes role successfully', async () => {
    const role = {
      id: { value: 'role-123' },
      delete: vi.fn().mockReturnValue(ok(undefined)),
      pullDomainEvents: vi.fn().mockReturnValue([]),
    } as any;

    const mockRoleRepo = {
      findById: vi.fn().mockResolvedValue(role),
      delete: vi.fn().mockResolvedValue(undefined),
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

    const handler = new DeleteRoleHandler(mockUow);

    const command: DeleteRoleCommand = {
      roleId: 'role-123',
      actorId: 'user-123',
    };

    const result = await handler.execute(command);

    expect(result.isOk()).toBe(true);
    const deleteResult = (result as any).value as DeleteRoleResult;
    expect(deleteResult.id).toBe('role-123');
    expect(deleteResult.deleted).toBe(true);

    expect(mockRoleRepo.findById).toHaveBeenCalled();
    expect(role.delete).toHaveBeenCalledWith('user-123');
    expect(mockRoleRepo.delete).toHaveBeenCalled();
    expect(mockOutbox.enqueueAll).toHaveBeenCalled();
  });

  it('validates empty roleId', async () => {
    const mockUow = {
      roles: { findById: vi.fn() },
      outbox: { enqueueAll: vi.fn() },
      withTransaction: vi.fn(),
    } as unknown as AccessControlUnitOfWork;

    const handler = new DeleteRoleHandler(mockUow);

    const command: DeleteRoleCommand = {
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

    const handler = new DeleteRoleHandler(mockUow);

    const command: DeleteRoleCommand = {
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

    const handler = new DeleteRoleHandler(mockUow);

    const command: DeleteRoleCommand = {
      roleId: 'role-123',
      actorId: 'user-123',
    };

    const result = await handler.execute(command);

    expect(result.isErr()).toBe(true);
    expect((result as any).error.code).toBe('ROLE_NOT_FOUND');
  });

  it('rejects system role deletion', async () => {
    const role = {
      id: { value: 'role-123' },
      delete: vi.fn().mockReturnValue({ isErr: () => true, error: { code: 'ROLE_SYSTEM_IMMUTABLE' } }),
    } as any;

    const mockRoleRepo = {
      findById: vi.fn().mockResolvedValue(role),
    } as unknown as RoleRepository;

    const mockUow = {
      roles: mockRoleRepo,
      outbox: { enqueueAll: vi.fn() },
      withTransaction: vi.fn(),
    } as unknown as AccessControlUnitOfWork;

    const handler = new DeleteRoleHandler(mockUow);

    const command: DeleteRoleCommand = {
      roleId: 'role-123',
      actorId: 'user-123',
    };

    const result = await handler.execute(command);

    expect(result.isErr()).toBe(true);
    expect((result as any).error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects empty deletedBy', async () => {
    const role = {
      id: { value: 'role-123' },
      delete: vi.fn().mockReturnValue({ isErr: () => true, error: { code: 'ROLE_DELETED_BY_EMPTY' } }),
    } as any;

    const mockRoleRepo = {
      findById: vi.fn().mockResolvedValue(role),
    } as unknown as RoleRepository;

    const mockUow = {
      roles: mockRoleRepo,
      outbox: { enqueueAll: vi.fn() },
      withTransaction: vi.fn(),
    } as unknown as AccessControlUnitOfWork;

    const handler = new DeleteRoleHandler(mockUow);

    const command: DeleteRoleCommand = {
      roleId: 'role-123',
      actorId: 'user-123',
    };

    const result = await handler.execute(command);

    expect(result.isErr()).toBe(true);
    expect((result as any).error.code).toBe('VALIDATION_ERROR');
  });
});
