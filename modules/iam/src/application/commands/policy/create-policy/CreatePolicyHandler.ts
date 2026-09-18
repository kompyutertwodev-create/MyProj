import type { Result } from '@workspace/kernel';
import { err, ok } from '@workspace/kernel';
import { Policy } from '../../../../domain/policy/Policy.js';
import { PolicyEffect } from '../../../../domain/policy/PolicyEffect.js';
import type { PolicyRepository } from '../../../../domain/policy/PolicyRepository.js';
import type { CreatePolicyCommand } from './CreatePolicyCommand.js';
import type { ApplicationError } from '../../../ports/ApplicationError.js';
import { InternalApplicationError } from '../../../ports/ApplicationError.js';
import type { AttributeCondition } from '../../../../domain/policy/AttributeCondition.js';

export class CreatePolicyHandler {
  constructor(private readonly policyRepository: PolicyRepository) {}

  async execute(command: CreatePolicyCommand): Promise<Result<Policy, ApplicationError>> {
    try {
      const policy = Policy.create({
        name: command.name,
        description: command.description ?? '',
        effect: command.effect === 'deny' ? PolicyEffect.Deny : PolicyEffect.Allow,
        subjects: command.subjects,
        resources: command.resources,
        actions: command.actions,
        conditions: (command.conditions ?? []) as unknown as AttributeCondition[],
        priority: command.priority ?? 100,
        isActive: command.isActive ?? true,
        createdBy: command.createdBy ?? 'system',
      });

      await this.policyRepository.save(policy);

      return ok(policy);
    } catch (error) {
      return err(
        new InternalApplicationError(
          error instanceof Error ? error.message : 'Failed to create policy'
        )
      );
    }
  }
}
