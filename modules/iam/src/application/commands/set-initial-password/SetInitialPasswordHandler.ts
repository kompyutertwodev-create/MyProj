import type { DomainEvent, Result } from '@workspace/kernel';
import { err, ok } from '@workspace/kernel';
import { PasswordHash } from '../../../domain/index.js';
import type { UserRepository, PasswordService } from '../../../domain/index.js';
import type { SetInitialPasswordCommand } from './SetInitialPasswordCommand.js';
import type { ApplicationError } from '../../ports/ApplicationError.js';
import {
  ConflictApplicationError,
  NotFoundApplicationError,
  ValidationApplicationError,
} from '../../ports/ApplicationError.js';
import type { EventBusPort } from '../../ports/EventBusPort.js';
import type { IamTransactionContext, IamUnitOfWork } from '../../ports/IamUnitOfWork.js';
import type { OutboxPort } from '../../ports/OutboxPort.js';

type PasswordTransactionContext = {
  users: IamTransactionContext['users'];
  outbox?: OutboxPort;
};

export class SetInitialPasswordHandler {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordService: PasswordService,
    private readonly eventBus: EventBusPort,
    private readonly unitOfWork?: IamUnitOfWork
  ) {}

  async execute(command: SetInitialPasswordCommand): Promise<Result<void, ApplicationError>> {
    const events: DomainEvent[] = [];
    const result = this.unitOfWork
      ? await this.unitOfWork.run((context) =>
          this.executeWithRepositories(command, context, events)
        )
      : await this.executeWithRepositories(
          command,
          {
            users: this.userRepository,
            outbox: undefined,
          },
          events
        );

    if (!this.unitOfWork) {
      await this.eventBus.publishAll(events);
    }
    return result;
  }

  private async executeWithRepositories(
    command: SetInitialPasswordCommand,
    context: PasswordTransactionContext,
    events: DomainEvent[]
  ): Promise<Result<void, ApplicationError>> {
    const user = await context.users.findById(command.userId);
    if (!user) {
      return err(new NotFoundApplicationError(`User "${command.userId}" not found`));
    }
    if (user.passwordSet) {
      return err(new ConflictApplicationError('A local password is already configured'));
    }

    const strengthResult = this.passwordService.validateStrength(command.newPassword);
    if (strengthResult.isErr()) {
      return err(new ValidationApplicationError(strengthResult.error.message));
    }

    const hash = await this.passwordService.hash(command.newPassword);
    const passwordResult = user.setInitialPassword(PasswordHash.create(hash));
    if (passwordResult.isErr()) {
      return err(new ConflictApplicationError(passwordResult.error.message));
    }

    await context.users.save(user);
    const pendingEvents = user.pullDomainEvents();
    if (context.outbox) {
      await context.outbox.enqueueAll(pendingEvents);
    } else {
      events.push(...pendingEvents);
    }
    return ok(undefined);
  }
}
