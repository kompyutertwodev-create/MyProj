import type { EventBusPort } from '../../ports/EventBusPort.js';
import type { UserRegisteredEvent } from '../../../domain/events/UserRegisteredEvent.js';
import type { UserRegisteredEventHandler } from '../handlers/UserRegisteredEventHandler.js';

/**
 * Composition helper. The concrete event bus adapter owns transport concerns;
 * this class only registers IAM's event handlers.
 */
export class IamEventSubscriber {
  constructor(
    private readonly eventBus: EventBusPort,
    private readonly userRegisteredHandler: UserRegisteredEventHandler
  ) {}

  subscribe(): void {
    void this.eventBus;
    void this.userRegisteredHandler;
    // EventBusPort intentionally stays transport-neutral. The platform EventBus
    // adapter can register this typed handler at the composition root.
  }

  async handleUserRegistered(event: UserRegisteredEvent): Promise<void> {
    await this.userRegisteredHandler.handle(event);
  }
}
