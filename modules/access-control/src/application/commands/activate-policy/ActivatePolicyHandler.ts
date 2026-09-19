import { err, ok, type Result } from '@workspace/kernel';
import { PolicyId } from '../../../domain/policy/PolicyId.js';
import type { AccessControlUnitOfWork } from '../../ports/AccessControlUnitOfWork.js';
import {
  ApplicationError,
  NotFoundApplicationError,
  ValidationApplicationError,
} from '../../ports/ApplicationError.js';
import type { ActivatePolicyCommand } from './ActivatePolicyCommand.js';

/** Result of a successful activation. */
export interface ActivatePolicyResult {
  id: string;
  isActive: true;
  updatedAt: string;
}

/**
 * Activate a Policy so the evaluator starts applying it.
 *
 * No-op requests (already active) are rejected by the aggregate rather than
 * silently ignored, so the caller cannot drift from the intended state.
 */
export class ActivatePolicyHandler {
  constructor(private readonly uow: AccessControlUnitOfWork) {}

  async execute(
    command: ActivatePolicyCommand,
  ): Promise<Result<ActivatePolicyResult, ApplicationError>> {
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

    const activateResult = policy.activate();
    if (activateResult.isErr()) {
      return err(new ValidationApplicationError(activateResult.error.message));
    }

    await this.uow.withTransaction(async (tx) => {
      await tx.policies.save(policy);
      await tx.outbox.enqueueAll(policy.pullDomainEvents());
    });

    return ok({
      id: policy.id.value,
      isActive: true,
      updatedAt: policy.updatedAt.toISOString(),
    });
  }
}