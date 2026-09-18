import type { DomainEvent, Result } from '@workspace/kernel';
import { err, ok } from '@workspace/kernel';
import type { UserRepository, RoleRepository } from '../../../domain/index.js';
import type { AssignRoleCommand } from './AssignRoleCommand.js';
import type { ApplicationError } from '../../ports/ApplicationError.js';
import {
  NotFoundApplicationError,
  ValidationApplicationError,
} from '../../ports/ApplicationError.js';
import type { EventBusPort } from '../../ports/EventBusPort.js';
import type { IamTransactionContext, IamUnitOfWork } from '../../ports/IamUnitOfWork.js';

export class AssignRoleHandler {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly roleRepository: RoleRepository,
    private readonly eventBus: EventBusPort,
    private readonly unitOfWork?: IamUnitOfWork
  ) {}

  async execute(command: AssignRoleCommand): Promise<Result<void, ApplicationError>> {
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

    // Event delivery is deliberately outside the database transaction. A
    // failed publish must not make the database transaction appear committed.
    if (result.isOk() && !this.unitOfWork) {
      for (const event of events) {
        await this.eventBus.publish(event);
      }
    }
    return result;
  }

  private async executeWithRepositories(
    command: AssignRoleCommand,
    context: IamTransactionContext,
    events: DomainEvent[]
  ): Promise<Result<void, ApplicationError>> {
    const user = await context.users.findById(command.userId);
    if (!user) {
      return err(new NotFoundApplicationError(`User "${command.userId}" not found`));
    }

    const role = await context.roles.findByName(command.roleName);
    if (!role) {
      return err(new NotFoundApplicationError(`Role "${command.roleName}" not found`));
    }

    const assignResult = user.assignRole(role);
    if (assignResult.isErr()) {
      return err(new ValidationApplicationError(assignResult.error.message));
    }

    await context.users.save(user);
    await context.users.assignRole(user.id.value, role);

    const pendingEvents = user.pullDomainEvents();
    if (context.outbox) {
      await context.outbox.enqueueAll(pendingEvents);
    } else {
      events.push(...pendingEvents);
    }

    return ok(undefined);
  }
}
