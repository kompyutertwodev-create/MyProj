import {
  DefaultTemplateCatalog,
  DrizzleNotificationRepository,
  InMemoryNotificationSenderRegistry,
  ListNotificationsHandler,
  NotificationDispatcher,
  PlatformEmailSender,
  SendNotificationHandler,
  TelegramBotSender,
  NOTIFIED_EVENT_NAMES,
} from '@workspace/notification';
import type { ContactResolver } from '@workspace/notification';
import type { PostgresDatabase, EventBus } from '@workspace/platform';
import type { DomainEvent } from '@workspace/kernel';

export interface NotificationContainer {
  notifications: DrizzleNotificationRepository;
  sendNotification: SendNotificationHandler;
  listNotifications: ListNotificationsHandler;
  senderRegistry: InMemoryNotificationSenderRegistry;
  dispatcher: NotificationDispatcher;
}

export interface NotificationContainerOptions {
  database: PostgresDatabase;
  eventBus?: EventBus;
  contactResolver: ContactResolver;
  emailSender?: PlatformEmailSender;
  telegramBotToken?: string;
}

export function createNotificationContainer(
  options: NotificationContainerOptions
): NotificationContainer {
  const { db } = options.database;

  const notifications = new DrizzleNotificationRepository(db);
  const senderRegistry = new InMemoryNotificationSenderRegistry();

  if (options.emailSender) {
    senderRegistry.register(options.emailSender);
  }

  if (options.telegramBotToken) {
    senderRegistry.register(new TelegramBotSender({ botToken: options.telegramBotToken }));
  }

  const sendNotification = new SendNotificationHandler(notifications, senderRegistry);
  const listNotifications = new ListNotificationsHandler(notifications);
  const dispatcher = new NotificationDispatcher(
    sendNotification,
    options.contactResolver,
    new DefaultTemplateCatalog()
  );

  // Subscribe to each notified event name explicitly.
  if (options.eventBus) {
    for (const eventName of NOTIFIED_EVENT_NAMES) {
      options.eventBus.subscribe(eventName, {
        handle: (event: DomainEvent) => dispatcher.handle(event),
      });
    }
  }

  return {
    notifications,
    sendNotification,
    listNotifications,
    senderRegistry,
    dispatcher,
  };
}
