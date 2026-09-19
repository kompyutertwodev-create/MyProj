import { err, ok, type Result } from '@workspace/kernel';
import { PolicyId } from '../../../domain/policy/PolicyId.js';
import type { AccessControlUnitOfWork } from '../../ports/AccessControlUnitOfWork.js';
import {
  ApplicationError,
  NotFoundApplicationError,
  ValidationApplicationError,
} from '../../ports/ApplicationError.js';
import type { DeactivatePolicyCommand } from './DeactivatePolicyCommand.js';

/** Result of a successful deactivation. */
export interface DeactivatePolicyResult {
  id: string;
  isActive: false;
  updatedAt: string;
}

/**
 * Deactivate a Policy so the evaluator stops applying it.
 *
 * Deactivation does not delete the policy — it can be re-activated later
 * with {@link ActivatePolicyHandler}.
 */
export class DeactivatePolicyHandler {
  constructor(private readonly uow: AccessControlUnitOfWork) {}

  async execute(
    command: DeactivatePolicyCommand,
  ): Promise<Result<DeactivatePolicyResult, ApplicationError>> {
    const policyId = (command.policyId ?? '').trim();
    if (policyId.length === 0) {
      return err(
        new ValidationApplicationError('policyId is required', 'POLICY_ID_REQUIRED'),
      );
    }

    const actorId = (command.actorId ?? '').trim();
    if (actorId.length === 0) {
      return err(
        new ValidationApplicationError('actorId is required', 'ACTOR_REQUIRED'),
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

    const deactivateResult = policy.deactivate();
    if (deactivateResult.isErr()) {
      return err(new ValidationApplicationError(deactivateResult.error.message));
    }

    await this.uow.withTransaction(async (tx) => {
      await tx.policies.save(policy);
      await tx.outbox.enqueueAll(policy.pullDomainEvents());
    });

    return ok({
      id: policy.id.value,
      isActive: false,
      updatedAt: policy.updatedAt.toISOString(),
    });
  }
}