import type { Result } from '@workspace/kernel';
import { err, ok } from '@workspace/kernel';
import type { UserRepository } from '../../../domain/index.js';
import type { SuspendUserCommand } from './SuspendUserCommand.js';
import type { ApplicationError } from '../../ports/ApplicationError.js';
import {
  NotFoundApplicationError,
  ValidationApplicationError,
} from '../../ports/ApplicationError.js';
import type { EventBusPort } from '../../ports/EventBusPort.js';

export class SuspendUserHandler {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly eventBus: EventBusPort
  ) {}

  async execute(command: SuspendUserCommand): Promise<Result<void, ApplicationError>> {
    const user = await this.userRepository.findById(command.userId);
    if (!user) {
      return err(new NotFoundApplicationError(`User "${command.userId}" not found`));
    }

    const suspendResult = user.suspend(command.reason);
    if (suspendResult.isErr()) {
      return err(new ValidationApplicationError(suspendResult.error.message));
    }

    await this.userRepository.save(user);

    const events = user.pullDomainEvents();
    for (const event of events) {
      await this.eventBus.publish(event);
    }

    return ok(undefined);
  }
}
