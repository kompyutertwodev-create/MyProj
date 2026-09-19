import type { DomainEvent } from '@workspace/kernel';
import type { EventHandler } from '@workspace/platform';
import type { ContactResolver } from '../ports/ContactResolver.js';
import type { SendNotificationHandler } from '../commands/send-notification/SendNotificationHandler.js';
import type { TemplateCatalog } from './NotificationTemplate.js';

/**
 * Listens to foreign domain events and dispatches notifications.
 *
 * Responsibilities:
 * - Map event -> template
 * - Resolve recipient contact via ContactResolver
 * - Delegate to SendNotificationHandler
 *
 * Never imports foreign domain modules — only inspects eventName and payload.
 */
export class NotificationDispatcher implements EventHandler {
  constructor(
    private readonly sendNotification: SendNotificationHandler,
    private readonly contactResolver: ContactResolver,
    private readonly templates: TemplateCatalog
  ) {}

  async handle(event: DomainEvent): Promise<void> {
    const recipientId = this.extractRecipientId(event);
    if (!recipientId) return;

    const payload = event as unknown as Record<string, unknown>;
    const template = this.templates.find(event.eventName, { recipientId, payload });
    if (!template) return;

    const contact = await this.contactResolver.resolve(recipientId, template.channel);
    if (!contact) return;

    await this.sendNotification.execute({
      recipientId,
      channel: template.channel,
      contact: contact.value,
      subject: template.subject,
      body: template.body,
      templateKey: event.eventName,
      metadata: { eventId: event.eventId, eventName: event.eventName },
    });
  }

  private extractRecipientId(event: DomainEvent): string | null {
    const payload = event as unknown as Record<string, unknown>;
    switch (event.eventName) {
      case 'iam.UserRegistered':
        return String(payload['userId'] ?? event.aggregateId);
      case 'tenant.created':
        return String(payload['ownerUserId'] ?? null) || null;
      case 'tenant.member.added':
        return String(payload['userId'] ?? null) || null;
      default:
        return null;
    }
  }
}
