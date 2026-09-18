import type { DomainEvent, Result } from '@workspace/kernel';
import { err, ok } from '@workspace/kernel';
import { Email, PasswordHash, User, UserStatus } from '../../../domain/index.js';
import type { UserRepository } from '../../../domain/index.js';
import type { RoleRepository } from '../../../domain/index.js';
import type { PasswordService } from '../../../domain/index.js';
import type { RegisterUserCommand } from './RegisterUserCommand.js';
import type { RegisterUserResult } from './RegisterUserResult.js';
import type { ApplicationError } from '../../ports/ApplicationError.js';
import {
  ConflictApplicationError,
  InternalApplicationError,
  ValidationApplicationError,
} from '../../ports/ApplicationError.js';
import type { EventBusPort } from '../../ports/EventBusPort.js';
import type { IamTransactionContext, IamUnitOfWork } from '../../ports/IamUnitOfWork.js';

export class RegisterUserHandler {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordService: PasswordService,
    private readonly roleRepository: RoleRepository,
    private readonly eventBus: EventBusPort,
    private readonly unitOfWork?: IamUnitOfWork
  ) {}

  async execute(
    command: RegisterUserCommand
  ): Promise<Result<RegisterUserResult, ApplicationError>> {
    const events: DomainEvent[] = [];
    const result = this.unitOfWork
      ? await this.unitOfWork.run((context) =>
          this.executeWithRepositories(command, context, events)
        )
      : await this.executeWithRepositories(
          command,
          {
            users: this.userRepository,
            roles: this.roleRepository,
            sessions: undefined as never,
            socialIdentities: undefined as never,
            outbox: undefined as never,
          },
          events
        );

    if (!this.unitOfWork) {
      await this.eventBus.publishAll(events);
    }
    return result;
  }

  private async executeWithRepositories(
    command: RegisterUserCommand,
    context: IamTransactionContext,
    events: DomainEvent[]
  ): Promise<Result<RegisterUserResult, ApplicationError>> {
    // Validate email
    const emailResult = Email.create(command.email);
    if (emailResult.isErr()) {
      return err(new ValidationApplicationError(emailResult.error.message));
    }

    // Validate password strength
    const strengthResult = this.passwordService.validateStrength(command.password);
    if (strengthResult.isErr()) {
      return err(new ValidationApplicationError(strengthResult.error.message));
    }

    // Check if email already exists
    const exists = await context.users.exists(emailResult.value.value);
    if (exists) {
      return err(new ConflictApplicationError(`Email "${command.email}" is already registered`));
    }

    // Hash the password
    const hash = await this.passwordService.hash(command.password);
    const passwordHash = PasswordHash.create(hash);

    // Create user
    const userResult = User.create({
      email: emailResult.value,
      passwordHash,
      displayName: command.displayName,
      // Email verification is not exposed as an HTTP flow yet. New accounts
      // must therefore be usable immediately; a future verification flow can
      // explicitly choose UserStatus.Unverified.
      status: UserStatus.Active,
    });

    if (userResult.isErr()) {
      return err(new ValidationApplicationError(userResult.error.message));
    }

    const user = userResult.value;
    const defaultRole = await context.roles.findByName('user');
    if (!defaultRole) {
      return err(new InternalApplicationError('Default user role is not configured'));
    }
    const roleAssignment = user.assignRole(defaultRole);
    if (roleAssignment.isErr()) {
      return err(new InternalApplicationError('Default user role could not be assigned'));
    }

    // Persist
    await context.users.save(user);
    await context.users.assignRole(user.id.value, defaultRole);

    // Publish domain events
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
