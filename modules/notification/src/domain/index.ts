// Value Objects
export { NotificationId } from './NotificationId.js';
export { RecipientId } from './RecipientId.js';
export { RecipientContact } from './RecipientContact.js';

// Enums
export { NotificationChannel } from './NotificationChannel.js';
export { NotificationStatus } from './NotificationStatus.js';

// Aggregates
export { Notification } from './Notification.js';
export type { NotificationCreateProps, NotificationReconstructProps } from './Notification.js';

// Events
export { NotificationSentEvent } from './events/NotificationSentEvent.js';
export { NotificationFailedEvent } from './events/NotificationFailedEvent.js';

// Repositories
export type {
  NotificationRepository,
  NotificationFilter,
} from './repositories/NotificationRepository.js';
