import { err, ok, type Result } from '@workspace/kernel';
import { PolicyId } from '../../../domain/policy/PolicyId.js';
import type { AccessControlUnitOfWork } from '../../ports/AccessControlUnitOfWork.js';
import {
  ApplicationError,
  NotFoundApplicationError,
  ValidationApplicationError,
} from '../../ports/ApplicationError.js';
import type { DeletePolicyCommand } from './DeletePolicyCommand.js';

/** Result of a successful delete. */
export interface DeletePolicyResult {
  id: string;
  deleted: true;
}

/**
 * Soft-delete a Policy.
 *
 * The aggregate flips `isDeleted` and `isActive` to false and emits a
 * PolicyDeletedEvent carrying the deleting actor so audit can record
 * *who* removed the policy.
 */
export class DeletePolicyHandler {
  constructor(private readonly uow: AccessControlUnitOfWork) {}

  async execute(
    command: DeletePolicyCommand,
  ): Promise<Result<DeletePolicyResult, ApplicationError>> {
    const policyId = (command.policyId ?? '').trim();
    if (policyId.length === 0) {
      return err(
        new ValidationApplicationError('policyId is required', 'POLICY_ID_REQUIRED'),
      );
    }

    const deletedBy = (command.deletedBy ?? '').trim();
    if (deletedBy.length === 0) {
      return err(
        new ValidationApplicationError('deletedBy is required', 'DELETED_BY_REQUIRED'),
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

    const deleteResult = policy.delete(deletedBy);
    if (deleteResult.isErr()) {
      return err(new ValidationApplicationError(deleteResult.error.message));
    }

    await this.uow.withTransaction(async (tx) => {
      await tx.policies.save(policy);
      await tx.outbox.enqueueAll(policy.pullDomainEvents());
    });

    return ok({ id: policy.id.value, deleted: true });
  }
}