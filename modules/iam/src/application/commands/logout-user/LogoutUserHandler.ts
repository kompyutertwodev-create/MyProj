import type { Result } from '@workspace/kernel';
import { err, ok } from '@workspace/kernel';
import type { SessionRepository } from '../../../domain/index.js';
import type { LogoutUserCommand } from './LogoutUserCommand.js';
import type { ApplicationError } from '../../ports/ApplicationError.js';
import { NotFoundApplicationError } from '../../ports/ApplicationError.js';
import type { EventBusPort } from '../../ports/EventBusPort.js';
import { UserLoggedOutEvent } from '../../../domain/index.js';

export class LogoutUserHandler {
  constructor(
    private readonly sessionRepository: SessionRepository,
    private readonly eventBus: EventBusPort
  ) {}

  async execute(command: LogoutUserCommand): Promise<Result<void, ApplicationError>> {
    const session = await this.sessionRepository.findById(command.sessionId);
    if (!session) {
      return err(new NotFoundApplicationError(`Session "${command.sessionId}" not found`));
    }

    session.revoke();
    await this.sessionRepository.delete(session.id.value);

    await this.eventBus.publish(
      new UserLoggedOutEvent(command.userId, command.userId, command.sessionId)
    );

    return ok(undefined);
  }
}
