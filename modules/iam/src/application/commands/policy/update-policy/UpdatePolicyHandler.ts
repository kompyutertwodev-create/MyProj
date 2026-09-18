import type { Result } from '@workspace/kernel';
import { err, ok } from '@workspace/kernel';
import { Policy } from '../../../../domain/policy/Policy.js';
import { PolicyEffect } from '../../../../domain/policy/PolicyEffect.js';
import type { PolicyRepository } from '../../../../domain/policy/PolicyRepository.js';
import type { UpdatePolicyCommand } from './UpdatePolicyCommand.js';
import type { ApplicationError } from '../../../ports/ApplicationError.js';
import {
  NotFoundApplicationError,
  InternalApplicationError,
} from '../../../ports/ApplicationError.js';

export class UpdatePolicyHandler {
  constructor(private readonly policyRepository: PolicyRepository) {}

  async execute(command: UpdatePolicyCommand): Promise<Result<Policy, ApplicationError>> {
    const policy = await this.policyRepository.findById(command.id);
    if (!policy) {
      return err(new NotFoundApplicationError(`Policy with id ${command.id} not found`));
    }

    try {
      // Update fields
      if (command.name !== undefined) policy.updateName(command.name);
      if (command.description !== undefined) policy.updateDescription(command.description);
      if (command.effect !== undefined) {
        policy.updateEffect(command.effect === 'deny' ? PolicyEffect.Deny : PolicyEffect.Allow);
      }
      if (command.subjects !== undefined) policy.updateSubjects(command.subjects);
      if (command.resources !== undefined) policy.updateResources(command.resources);
      if (command.actions !== undefined) policy.updateActions(command.actions);
      if (command.conditions !== undefined) {
        policy.updateConditions(command.conditions as unknown as any);
      }
      if (command.priority !== undefined) policy.updatePriority(command.priority);
      if (command.isActive !== undefined) {
        command.isActive ? policy.activate() : policy.deactivate();
      }

      await this.policyRepository.save(policy);

      return ok(policy);
    } catch (error) {
      return err(
        new InternalApplicationError(
          error instanceof Error ? error.message : 'Failed to update policy'
        )
      );
    }
  }
}
