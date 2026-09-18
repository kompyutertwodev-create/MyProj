import type { Result } from '@workspace/kernel';
import { err, ok } from '@workspace/kernel';
import type { PolicyRepository } from '../../../../domain/policy/PolicyRepository.js';
import type { DeletePolicyCommand } from './DeletePolicyCommand.js';
import type { ApplicationError } from '../../../ports/ApplicationError.js';
import {
  NotFoundApplicationError,
  InternalApplicationError,
} from '../../../ports/ApplicationError.js';

export class DeletePolicyHandler {
  constructor(private readonly policyRepository: PolicyRepository) {}

  async execute(command: DeletePolicyCommand): Promise<Result<void, ApplicationError>> {
    const policy = await this.policyRepository.findById(command.id);
    if (!policy) {
      return err(new NotFoundApplicationError(`Policy with id ${command.id} not found`));
    }

    try {
      await this.policyRepository.delete(command.id);
      return ok(undefined);
    } catch (error) {
      return err(
        new InternalApplicationError(
          error instanceof Error ? error.message : 'Failed to delete policy'
        )
      );
    }
  }
}
