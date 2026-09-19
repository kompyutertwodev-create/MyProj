import { err, ok, type Result } from '@workspace/kernel';
import { PolicyId } from '../../../domain/policy/PolicyId.js';
import type { AccessControlUnitOfWork } from '../../ports/AccessControlUnitOfWork.js';
import {
  ApplicationError,
  ConflictApplicationError,
  NotFoundApplicationError,
  ValidationApplicationError,
} from '../../ports/ApplicationError.js';
import type { UpdatePolicyCommand } from './UpdatePolicyCommand.js';

/** Result of a successful policy update. */
export interface UpdatePolicyResult {
  id: string;
  name: string;
  effect: string;
  priority: number;
  isActive: boolean;
  updatedAt: string;
}

/**
 * Apply a partial update to a Policy.
 *
 * Only the fields present in the command are applied, and each mutator
 * is delegated to the aggregate so validation stays in one place.
 * If `name` changes, the handler checks uniqueness against the repository
 * (excluding the policy itself).
 */
export class UpdatePolicyHandler {
  constructor(private readonly uow: AccessControlUnitOfWork) {}

  async execute(
    command: UpdatePolicyCommand,
  ): Promise<Result<UpdatePolicyResult, ApplicationError>> {
    const policyId = (command.policyId ?? '').trim();
    if (policyId.length === 0) {
      return err(
        new ValidationApplicationError(
          'policyId is required',
          'POLICY_ID_REQUIRED',
        ),
      );
    }

    const updatedBy = (command.updatedBy ?? '').trim();
    if (updatedBy.length === 0) {
      return err(
        new ValidationApplicationError(
          'updatedBy is required',
          'UPDATED_BY_REQUIRED',
        ),
      );
    }

    const policy = await this.uow.policies.findById(new PolicyId(policyId));
    if (!policy) {
      return err(
        new NotFoundApplicationError(
          `Policy "${policyId}" was not found`,
          'POLICY_NOT_FOUND',
        ),
      );
    }

    if (command.name !== undefined) {
      const taken = await this.uow.policies.existsByName(
        command.name,
        policyId,
      );
      if (taken) {
        return err(
          new ConflictApplicationError(
            `Policy name "${command.name}" is already taken`,
            'POLICY_NAME_TAKEN',
          ),
        );
      }
      const r = policy.updateName(command.name);
      if (r.isErr()) {
        return err(new ValidationApplicationError(r.error.message));
      }
    }

    if (command.description !== undefined) {
      const r = policy.updateDescription(command.description);
      if (r.isErr()) {
        return err(new ValidationApplicationError(r.error.message));
      }
    }

    if (command.effect !== undefined) {
      const r = policy.updateEffect(command.effect);
      if (r.isErr()) {
        return err(new ValidationApplicationError(r.error.message));
      }
    }

    if (command.subjects !== undefined) {
      const r = policy.updateSubjects(command.subjects);
      if (r.isErr()) {
        return err(new ValidationApplicationError(r.error.message));
      }
    }

    if (command.resources !== undefined) {
      const r = policy.updateResources(command.resources);
      if (r.isErr()) {
        return err(new ValidationApplicationError(r.error.message));
      }
    }

    if (command.actions !== undefined) {
      const r = policy.updateActions(command.actions);
      if (r.isErr()) {
        return err(new ValidationApplicationError(r.error.message));
      }
    }

    if (command.conditions !== undefined) {
      const r = policy.updateConditions(command.conditions);
      if (r.isErr()) {
        return err(new ValidationApplicationError(r.error.message));
      }
    }

    if (command.priority !== undefined) {
      const r = policy.updatePriority(command.priority);
      if (r.isErr()) {
        return err(new ValidationApplicationError(r.error.message));
      }
    }

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
      updatedAt: policy.updatedAt.toISOString(),
    });
  }
}