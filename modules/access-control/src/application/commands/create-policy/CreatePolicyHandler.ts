import { err, ok, type Result } from '@workspace/kernel';
import { Policy } from '../../../domain/policy/Policy.js';
import type { AccessControlUnitOfWork } from '../../ports/AccessControlUnitOfWork.js';
import {
  ApplicationError,
  ConflictApplicationError,
  ValidationApplicationError,
} from '../../ports/ApplicationError.js';
import type { CreatePolicyCommand } from './CreatePolicyCommand.js';

/** Result of a successful policy creation. */
export interface CreatePolicyResult {
  id: string;
  name: string;
  effect: string;
  priority: number;
  isActive: boolean;
  tenantId: string | null;
  createdAt: string;
}

/**
 * Create a new Policy and persist it inside one transaction.
 *
 * Policies are unique by name within a tenant; the check runs in the same
 * Unit of Work as the insert so concurrent requests cannot both pass.
 */
export class CreatePolicyHandler {
  constructor(private readonly uow: AccessControlUnitOfWork) {}

  async execute(
    command: CreatePolicyCommand,
  ): Promise<Result<CreatePolicyResult, ApplicationError>> {
    const createdBy = (command.createdBy ?? '').trim();
    if (createdBy.length === 0) {
      return err(
        new ValidationApplicationError(
          'createdBy is required',
          'CREATED_BY_REQUIRED',
        ),
      );
    }

    const duplicate = await this.uow.policies.existsByName(command.name);
    if (duplicate) {
      return err(
        new ConflictApplicationError(
          `Policy "${command.name}" already exists`,
          'POLICY_NAME_TAKEN',
        ),
      );
    }

    const buildResult = Policy.create({
      name: command.name,
      description: command.description ?? '',
      effect: command.effect,
      subjects: command.subjects,
      resources: command.resources,
      actions: command.actions,
      conditions: command.conditions ?? [],
      priority: command.priority ?? 100,
      isActive: command.isActive ?? true,
      createdBy,
      tenantId: command.tenantId ?? null,
    });
    if (buildResult.isErr()) {
      return err(new ValidationApplicationError(buildResult.error.message));
    }
    const policy = buildResult.value;

    await this.uow.withTransaction(async (tx) => {
      await tx.policies.save(policy);
      await tx.outbox.enqueueAll(policy.pullDomainEvents());
    });

    return ok({
      id: policy.id.value,
      name: policy.name,
      effect: policy.effect,
      priority: policy.priority,
      isActive: policy.isActive,
      tenantId: policy.tenantId,
      createdAt: policy.createdAt.toISOString(),
    });
  }
}