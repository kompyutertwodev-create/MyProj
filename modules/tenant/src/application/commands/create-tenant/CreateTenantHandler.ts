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

/**
 * Create a new tenant + its owner member inside one transaction.
 *
 * When a UnitOfWork is provided the aggregate save, member save and
 * outbox enqueue all commit together. Otherwise (tests, early boots) the
 * repositories are used directly and events are published on the bus.
 */
export class CreateTenantHandler {
  constructor(
    private readonly tenantRepository: TenantRepository,
    private readonly memberRepository: MemberRepository,
    private readonly eventBus: EventBusPort,
    private readonly unitOfWork?: TenantUnitOfWork,
  ) {}

  async execute(
    command: CreateTenantCommand,
  ): Promise<Result<CreateTenantResult, ApplicationError>> {
    const events: DomainEvent[] = [];

    if (this.unitOfWork) {
      return this.unitOfWork.withTransaction((tx) =>
        this.executeWithRepositories(command, tx, events),
      );
    }

    const result = await this.executeWithRepositories(
      command,
      {
        tenants: this.tenantRepository,
        members: this.memberRepository,
        outbox: undefined as never,
      },
      events,
    );
    if (result.isOk()) {
      await this.eventBus.publishAll(events);
    }
    return result;
  }

  private async executeWithRepositories(
    command: CreateTenantCommand,
    context: TenantTransactionContext,
    events: DomainEvent[],
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