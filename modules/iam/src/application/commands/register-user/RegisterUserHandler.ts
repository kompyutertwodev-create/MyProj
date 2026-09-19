import type { DomainEvent, Result } from '@workspace/kernel';
import { err, ok } from '@workspace/kernel';
import { Email, PasswordHash, User, UserStatus } from '../../../domain/index.js';
import type { UserRepository, PasswordService } from '../../../domain/index.js';
import type { RegisterUserCommand } from './RegisterUserCommand.js';
import type { RegisterUserResult } from './RegisterUserResult.js';
import type { ApplicationError } from '../../ports/ApplicationError.js';
import {
  ConflictApplicationError,
  ValidationApplicationError,
} from '../../ports/ApplicationError.js';
import type { EventBusPort } from '../../ports/EventBusPort.js';
import type { IamTransactionContext, IamUnitOfWork } from '../../ports/IamUnitOfWork.js';

/**
 * Register a new user.
 *
 * RBAC is intentionally not touched here: assigning the default `user`
 * role happens through @workspace/access-control after registration, either
 * from the composition root or from an event handler that reacts to
 * UserRegisteredEvent.
 */
export class RegisterUserHandler {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordService: PasswordService,
    private readonly eventBus: EventBusPort,
    private readonly unitOfWork?: IamUnitOfWork,
  ) {}

  async execute(
    command: RegisterUserCommand,
  ): Promise<Result<RegisterUserResult, ApplicationError>> {
    const events: DomainEvent[] = [];
    const result = this.unitOfWork
      ? await this.unitOfWork.run((context) =>
          this.executeWithRepositories(command, context, events),
        )
      : await this.executeWithRepositories(
          command,
          {
            users: this.userRepository,
            sessions: undefined as never,
            socialIdentities: undefined as never,
            outbox: undefined as never,
          },
          events,
        );

    if (!this.unitOfWork) {
      await this.eventBus.publishAll(events);
    }
    return result;
  }

  private async executeWithRepositories(
    command: RegisterUserCommand,
    context: IamTransactionContext,
    events: DomainEvent[],
  ): Promise<Result<RegisterUserResult, ApplicationError>> {
    const emailResult = Email.create(command.email);
    if (emailResult.isErr()) {
      return err(new ValidationApplicationError(emailResult.error.message));
    }

    const strengthResult = this.passwordService.validateStrength(command.password);
    if (strengthResult.isErr()) {
      return err(new ValidationApplicationError(strengthResult.error.message));
    }

    const exists = await context.users.exists(emailResult.value.value);
    if (exists) {
      return err(
        new ConflictApplicationError(
          `Email "${command.email}" is already registered`,
        ),
      );
    }

    const hash = await this.passwordService.hash(command.password);
    const passwordHash = PasswordHash.create(hash);

    const userResult = User.create({
      email: emailResult.value,
      passwordHash,
      displayName: command.displayName,
      // Email verification is not exposed as an HTTP flow yet вЂ” accounts
      // are usable immediately. A future verification flow can choose
      // UserStatus.Unverified instead.
      status: UserStatus.Active,
    });

    if (userResult.isErr()) {
      return err(new ValidationApplicationError(userResult.error.message));
    }

    const user = userResult.value;

    await context.users.save(user);

    const pendingEvents = user.pullDomainEvents();
    if (context.outbox) {
      await context.outbox.enqueueAll(pendingEvents);
    } else {
      events.push(...pendingEvents);
    }

    return ok({
      userId: user.id.value,
      email: user.email.value,
      displayName: user.displayName,
    });
  }
}