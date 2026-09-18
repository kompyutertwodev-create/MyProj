import type { Result } from '@workspace/kernel';
import { err, ok } from '@workspace/kernel';
import { Policy } from '../../../../domain/policy/Policy.js';
import type { PolicyRepository } from '../../../../domain/policy/PolicyRepository.js';
import type { DeactivatePolicyCommand } from './DeactivatePolicyCommand.js';
import type { ApplicationError } from '../../../ports/ApplicationError.js';
import {
  NotFoundApplicationError,
  InternalApplicationError,
} from '../../../ports/ApplicationError.js';

export class DeactivatePolicyHandler {
  constructor(private readonly policyRepository: PolicyRepository) {}

  async execute(command: DeactivatePolicyCommand): Promise<Result<Policy, ApplicationError>> {
    const policy = await this.policyRepository.findById(command.id);
    if (!policy) {
      return err(new NotFoundApplicationError(`Policy with id ${command.id} not found`));
    }

    try {
      policy.deactivate();
      await this.policyRepository.save(policy);
      return ok(policy);
    } catch (error) {
      return err(
        new InternalApplicationError(
          error instanceof Error ? error.message : 'Failed to deactivate policy'
        )
      );
    }
  }
}
