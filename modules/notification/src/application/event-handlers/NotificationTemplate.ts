import type { NotificationChannel } from '../../domain/NotificationChannel.js';

export interface NotificationTemplate {
  channel: NotificationChannel;
  subject: string;
  body: string;
}

export interface TemplateContext {
  recipientId: string;
  payload: Record<string, unknown>;
}

/**
 * Template catalog: maps a domain event name to a notification template.
 */
export interface TemplateCatalog {
  find(eventName: string, context: TemplateContext): NotificationTemplate | null;
}

/**
 * Default templates shipped with the module.
 */
export class DefaultTemplateCatalog implements TemplateCatalog {
  find(eventName: string, context: TemplateContext): NotificationTemplate | null {
    const payload = context.payload;

    switch (eventName) {
      case 'iam.UserRegistered':
        return {
          channel: 'email' as NotificationChannel,
          subject: 'Welcome to Identity Platform',
          body:
            `Hi ${String(payload['displayName'] ?? 'there')},\n\n` +
            `Welcome aboard! Your account has been created.\n\n` +
            `— The Identity Platform team`,
        };

      case 'tenant.created':
        return {
          channel: 'email' as NotificationChannel,
          subject: `Welcome to ${String(payload['name'] ?? 'your new tenant')}`,
          body:
            `Your tenant "${String(payload['name'] ?? '')}" is ready.\n\n` +
            `Slug: ${String(payload['slug'] ?? '')}\n\n` +
            `— The Identity Platform team`,
        };

      case 'tenant.member.added':
        return {
          channel: 'email' as NotificationChannel,
          subject: 'You were added to a tenant',
          body: `You have been added to a tenant as ${String(payload['role'] ?? 'member')}.`,
        };

      default:
        return null;
    }
  }
}
