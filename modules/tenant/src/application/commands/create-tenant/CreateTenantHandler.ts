import type { DomainEvent, Result } from '@workspace/kernel';
import { err, ok } from '@workspace/kernel';
import { Tenant, TenantName, TenantSlug } from '../../../domain/index.js';
import type { TenantRepository } from '../../../domain/index.js';
import type { MemberRepository } from '../../../domain/index.js';
import type { CreateTenantCommand } from './CreateTenantCommand.js';
import type { CreateTenantResult } from './CreateTenantResult.js';
import type { ApplicationError } from '../../ports/ApplicationError.js';
import {
  ConflictApplicationError,
  ValidationApplicationError,
} from '../../ports/ApplicationError.js';
import type { EventBusPort } from '../../ports/EventBusPort.js';
import type {
  TenantTransactionContext,
  TenantUnitOfWork,
} from '../../ports/TenantUnitOfWork.js';

export class CreateTenantHandler {
  constructor(
    private readonly tenantRepository: TenantRepository,
    private readonly memberRepository: MemberRepository,
    private readonly eventBus: EventBusPort,
    private readonly unitOfWork?: TenantUnitOfWork
  ) {}

  async execute(
    command: CreateTenantCommand
  ): Promise<Result<CreateTenantResult, ApplicationError>> {
    const events: DomainEvent[] = [];
    const result = this.unitOfWork
      ? await this.unitOfWork.run((context) =>
          this.executeWithRepositories(command, context, events)
        )
      : await this.executeWithRepositories(
          command,
          {
            tenants: this.tenantRepository,
            members: this.memberRepository,
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
    command: CreateTenantCommand,
    context: TenantTransactionContext,
    events: DomainEvent[]
  ): Promise<Result<CreateTenantResult, ApplicationError>> {
    const slugResult = TenantSlug.create(command.slug);
    if (slugResult.isErr()) {
      return err(new ValidationApplicationError(slugResult.error.message));
    }
    const slug = slugResult.value;

    const nameResult = TenantName.create(command.name);
    if (nameResult.isErr()) {
      return err(new ValidationApplicationError(nameResult.error.message));
    }
    const name = nameResult.value;

    if (!command.ownerUserId || command.ownerUserId.trim().length === 0) {
      return err(new ValidationApplicationError('Owner userId is required'));
    }

    const slugExists = await context.tenants.existsBySlug(slug.value);
    if (slugExists) {
      return err(new ConflictApplicationError(`Tenant slug "${slug.value}" is already taken`));
    }

    const tenantResult = Tenant.create({
      name,
      slug,
      ownerUserId: command.ownerUserId,
      settings: command.settings,
    });
    if (tenantResult.isErr()) {
      return err(new ValidationApplicationError(tenantResult.error.message));
    }
    const tenant = tenantResult.value;

    await context.tenants.save(tenant);
    await context.members.saveMany([...tenant.members], tenant.id.value);

    const pendingEvents = tenant.pullDomainEvents();
    if (context.outbox) {
      await context.outbox.enqueueAll(pendingEvents);
    } else {
      events.push(...pendingEvents);
    }

    return ok({
      tenantId: tenant.id.value,
      name: tenant.name.value,
      slug: tenant.slug.value,
      ownerUserId: tenant.ownerUserId,
    });
  }
}
