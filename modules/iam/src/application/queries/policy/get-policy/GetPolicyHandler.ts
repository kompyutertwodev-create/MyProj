import type { Result } from '@workspace/kernel';
import { err, ok } from '@workspace/kernel';
import { Policy } from '../../../../domain/policy/Policy.js';
import type { PolicyRepository } from '../../../../domain/policy/PolicyRepository.js';
import type { ApplicationError } from '../../../ports/ApplicationError.js';
import { NotFoundApplicationError } from '../../../ports/ApplicationError.js';

export class GetPolicyHandler {
  constructor(private readonly policyRepository: PolicyRepository) {}

  async execute(id: string): Promise<Result<Policy, ApplicationError>> {
    const policy = await this.policyRepository.findById(id);
    if (!policy) {
      return err(new NotFoundApplicationError(`Policy with id ${id} not found`));
    }

    return ok(policy);
  }
}
