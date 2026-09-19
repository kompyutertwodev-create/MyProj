import { describe, it, expect, vi } from 'vitest';
import { ok } from '@workspace/kernel';
import { AssignRoleHandler, type AssignRoleResult } from '../AssignRoleHandler.js';
import type { AssignRoleCommand } from '../AssignRoleCommand.js';
import type { AccessControlUnitOfWork } from '../../../ports/AccessControlUnitOfWork.js';
import type { RoleRepository } from '../../../../domain/role/RoleRepository.js';
import type { RoleAssignmentRepository } from '../../../../domain/assignment/RoleAssignmentRepository.js';
import type { OutboxPort } from '../../../ports/OutboxPort.js';

describe('AssignRoleHandler', () => {
  it('assigns role to user successfully', async () => {
    const role = {
      id: { value: 'role-123' },
      name: { value: 'admin' },
      tenantId: null,
    } as any;

    const assignment = {
      id: { value: 'assignment-123' },
      userId: 'user-123',
      roleId: 'role-123',
      roleName: 'admin',
      tenantId: null,
      assignedAt: new Date(),
      expiresAt: null,
      pullDomainEvents: vi.fn().mockReturnValue([]),
    } as any;

    const mockRoleRepo = {
      findById: vi.fn().mockResolvedValue(role),
    } as unknown as RoleRepository;

    const mockAssignmentRepo = {
      hasActiveAssignment: vi.fn().mockResolvedValue(false),
      save: vi.fn().mockResolvedValue(undefined),
    } as unknown as RoleAssignmentRepository;

    const mockOutbox = {
      enqueueAll: vi.fn().mockResolvedValue(undefined),
    } as unknown as OutboxPort;

    const mockUow = {
      roles: mockRoleRepo,
      roleAssignments: mockAssignmentRepo,
      outbox: mockOutbox,
      withTransaction: vi.fn().mockImplementation(async (callback) => {
        await callback({ roles: mockRoleRepo, roleAssignments: mockAssignmentRepo, outbox: mockOutbox });
      }),
    } as unknown as AccessControlUnitOfWork;

    const handler = new AssignRoleHandler(mockUow);

    const command: AssignRoleCommand = {
      userId: 'user-123',
      roleId: 'role-123',
      assignedBy: 'user-456',
    };

    const result = await handler.execute(command);

    expect(result.isOk()).toBe(true);
    const assignResult = (result as any).value as AssignRoleResult;
    expect(assignResult.userId).toBe('user-123');
    expect(assignResult.roleId).toBe('role-123');
    expect(assignResult.roleName).toBe('admin');

    expect(mockRoleRepo.findById).toHaveBeenCalled();
    expect(mockAssignmentRepo.hasActiveAssignment).toHaveBeenCalledWith('user-123', 'role-123');
    expect(mockAssignmentRepo.save).toHaveBeenCalled();
    expect(mockOutbox.enqueueAll).toHaveBeenCalled();
  });

  it('validates empty userId', async () => {
    const mockUow = {
      roles: { findById: vi.fn() },
      roleAssignments: { hasActiveAssignment: vi.fn() },
      outbox: { enqueueAll: vi.fn() },
      withTransaction: vi.fn(),
    } as unknown as AccessControlUnitOfWork;

    const handler = new AssignRoleHandler(mockUow);

    const command: AssignRoleCommand = {
      userId: '',
      roleId: 'role-123',
      assignedBy: 'user-456',
    };

    const result = await handler.execute(command);

    expect(result.isErr()).toBe(true);
    expect((result as any).error.code).toBe('USER_ID_REQUIRED');
  });

  it('validates empty roleId', async () => {
    const mockUow = {
      roles: { findById: vi.fn() },
      roleAssignments: { hasActiveAssignment: vi.fn() },
      outbox: { enqueueAll: vi.fn() },
      withTransaction: vi.fn(),
    } as unknown as AccessControlUnitOfWork;

    const handler = new AssignRoleHandler(mockUow);

    const command: AssignRoleCommand = {
      userId: 'user-123',
      roleId: '',
      assignedBy: 'user-456',
    };

    const result = await handler.execute(command);

    expect(result.isErr()).toBe(true);
    expect((result as any).error.code).toBe('ROLE_ID_REQUIRED');
  });

  it('validates empty assignedBy', async () => {
    const mockUow = {
      roles: { findById: vi.fn() },
      roleAssignments: { hasActiveAssignment: vi.fn() },
      outbox: { enqueueAll: vi.fn() },
      withTransaction: vi.fn(),
    } as unknown as AccessControlUnitOfWork;

    const handler = new AssignRoleHandler(mockUow);

    const command: AssignRoleCommand = {
      userId: 'user-123',
      roleId: 'role-123',
      assignedBy: '',
    };

    const result = await handler.execute(command);

    expect(result.isErr()).toBe(true);
    expect((result as any).error.code).toBe('ASSIGNED_BY_REQUIRED');
  });

  it('returns not found when role does not exist', async () => {
    const mockRoleRepo = {
      findById: vi.fn().mockResolvedValue(null),
    } as unknown as RoleRepository;

    const mockUow = {
      roles: mockRoleRepo,
      roleAssignments: { hasActiveAssignment: vi.fn() },
      outbox: { enqueueAll: vi.fn() },
      withTransaction: vi.fn(),
    } as unknown as AccessControlUnitOfWork;

    const handler = new AssignRoleHandler(mockUow);

    const command: AssignRoleCommand = {
      userId: 'user-123',
      roleId: 'role-123',
      assignedBy: 'user-456',
    };

    const result = await handler.execute(command);

    expect(result.isErr()).toBe(true);
    expect((result as any).error.code).toBe('ROLE_NOT_FOUND');
  });

  it('rejects duplicate assignment', async () => {
    const role = {
      id: { value: 'role-123' },
      name: { value: 'admin' },
    } as any;

    const mockRoleRepo = {
      findById: vi.fn().mockResolvedValue(role),
    } as unknown as RoleRepository;

    const mockAssignmentRepo = {
      hasActiveAssignment: vi.fn().mockResolvedValue(true),
    } as unknown as RoleAssignmentRepository;

    const mockUow = {
      roles: mockRoleRepo,
      roleAssignments: mockAssignmentRepo,
      outbox: { enqueueAll: vi.fn() },
      withTransaction: vi.fn(),
    } as unknown as AccessControlUnitOfWork;

    const handler = new AssignRoleHandler(mockUow);

    const command: AssignRoleCommand = {
      userId: 'user-123',
      roleId: 'role-123',
      assignedBy: 'user-456',
    };

    const result = await handler.execute(command);

    expect(result.isErr()).toBe(true);
    expect((result as any).error.code).toBe('ROLE_ALREADY_ASSIGNED');
  });

  it('accepts expiresAt', async () => {
    const role = {
      id: { value: 'role-123' },
      name: { value: 'admin' },
      tenantId: null,
    } as any;

    const assignment = {
      id: { value: 'assignment-123' },
      userId: 'user-123',
      roleId: 'role-123',
      roleName: 'admin',
      tenantId: null,
      assignedAt: new Date(),
      expiresAt: new Date('2030-01-01'),
      pullDomainEvents: vi.fn().mockReturnValue([]),
    } as any;

    const mockRoleRepo = {
      findById: vi.fn().mockResolvedValue(role),
    } as unknown as RoleRepository;

    const mockAssignmentRepo = {
      hasActiveAssignment: vi.fn().mockResolvedValue(false),
      save: vi.fn().mockResolvedValue(undefined),
    } as unknown as RoleAssignmentRepository;

    const mockOutbox = {
      enqueueAll: vi.fn().mockResolvedValue(undefined),
    } as unknown as OutboxPort;

    const mockUow = {
      roles: mockRoleRepo,
      roleAssignments: mockAssignmentRepo,
      outbox: mockOutbox,
      withTransaction: vi.fn().mockImplementation(async (callback) => {
        await callback({ roles: mockRoleRepo, roleAssignments: mockAssignmentRepo, outbox: mockOutbox });
      }),
    } as unknown as AccessControlUnitOfWork;

    const handler = new AssignRoleHandler(mockUow);

    const command: AssignRoleCommand = {
      userId: 'user-123',
      roleId: 'role-123',
      assignedBy: 'user-456',
      expiresAt: new Date('2030-01-01'),
    };

    const result = await handler.execute(command);

    expect(result.isOk()).toBe(true);
    const assignResult = (result as any).value as AssignRoleResult;
    expect(assignResult.expiresAt).toBe('2030-01-01T00:00:00.000Z');
  });

  it('accepts tenantId', async () => {
    const role = {
      id: { value: 'role-123' },
      name: { value: 'admin' },
      tenantId: null,
    } as any;

    const assignment = {
      id: { value: 'assignment-123' },
      userId: 'user-123',
      roleId: 'role-123',
      roleName: 'admin',
      tenantId: 'tenant-123',
      assignedAt: new Date(),
      expiresAt: null,
      pullDomainEvents: vi.fn().mockReturnValue([]),
    } as any;

    const mockRoleRepo = {
      findById: vi.fn().mockResolvedValue(role),
    } as unknown as RoleRepository;

    const mockAssignmentRepo = {
      hasActiveAssignment: vi.fn().mockResolvedValue(false),
      save: vi.fn().mockResolvedValue(undefined),
    } as unknown as RoleAssignmentRepository;

    const mockOutbox = {
      enqueueAll: vi.fn().mockResolvedValue(undefined),
    } as unknown as OutboxPort;

    const mockUow = {
      roles: mockRoleRepo,
      roleAssignments: mockAssignmentRepo,
      outbox: mockOutbox,
      withTransaction: vi.fn().mockImplementation(async (callback) => {
        await callback({ roles: mockRoleRepo, roleAssignments: mockAssignmentRepo, outbox: mockOutbox });
      }),
    } as unknown as AccessControlUnitOfWork;

    const handler = new AssignRoleHandler(mockUow);

    const command: AssignRoleCommand = {
      userId: 'user-123',
      roleId: 'role-123',
      assignedBy: 'user-456',
      tenantId: 'tenant-123',
    };

    const result = await handler.execute(command);

    expect(result.isOk()).toBe(true);
    const assignResult = (result as any).value as AssignRoleResult;
    expect(assignResult.tenantId).toBe('tenant-123');
  });
});
