/**
 * @workspace/notification — public surface for apps/api and other modules.
 */

// HTTP router factories
export { createNotificationRouter } from './presentation/index.js';
export type { NotificationRouterDependencies } from './presentation/index.js';

// Application handlers
export { SendNotificationHandler } from './application/commands/send-notification/SendNotificationHandler.js';
export { ListNotificationsHandler } from './application/queries/list-notifications/ListNotificationsHandler.js';
export { NotificationDispatcher } from './application/event-handlers/NotificationDispatcher.js';
export { DefaultTemplateCatalog } from './application/event-handlers/NotificationTemplate.js';
export type { TemplateCatalog } from './application/event-handlers/NotificationTemplate.js';
export { NOTIFIED_EVENT_NAMES } from './application/event-handlers/subscribed-events.js';

// Application views (DTOs)
export type { NotificationView } from './application/queries/NotificationView.js';

// Application ports (for composition root)
export type { NotificationSender, NotificationSendResult } from './application/ports/NotificationSender.js';
export type { NotificationSenderRegistry } from './application/ports/NotificationSenderRegistry.js';
export type { ContactResolver, ResolvedContact } from './application/ports/ContactResolver.js';

// Domain
export { Notification } from './domain/Notification.js';
export { NotificationId } from './domain/NotificationId.js';
export { RecipientId } from './domain/RecipientId.js';
export { RecipientContact } from './domain/RecipientContact.js';
export { NotificationChannel } from './domain/NotificationChannel.js';
export { NotificationStatus } from './domain/NotificationStatus.js';
export { NotificationSentEvent } from './domain/events/NotificationSentEvent.js';
export { NotificationFailedEvent } from './domain/events/NotificationFailedEvent.js';
export type { NotificationRepository, NotificationFilter } from './domain/repositories/NotificationRepository.js';

// Repository implementations
export { DrizzleNotificationRepository } from './infrastructure/repositories/DrizzleNotificationRepository.js';
export { InMemoryNotificationRepository } from './infrastructure/repositories/InMemoryNotificationRepository.js';

// Sender implementations
export { InMemoryNotificationSenderRegistry } from './infrastructure/senders/InMemoryNotificationSenderRegistry.js';
export { FakeNotificationSender } from './infrastructure/senders/FakeNotificationSender.js';
export { PlatformEmailSender } from './infrastructure/senders/PlatformEmailSender.js';
export type { PlatformEmailSenderOptions } from './infrastructure/senders/PlatformEmailSender.js';
export { TelegramBotSender } from './infrastructure/senders/telegram/TelegramBotSender.js';
export type { TelegramBotSenderOptions } from './infrastructure/senders/telegram/TelegramBotSender.js';

// DB schema
export { notifications } from './infrastructure/database/schema/index.js';
export type { NotificationRow, NotificationInsertRow } from './infrastructure/database/schema/index.js';
