import type { Result } from '@workspace/kernel';
import { err, ok } from '@workspace/kernel';
import { Notification } from '../../../domain/Notification.js';
import { RecipientContact } from '../../../domain/RecipientContact.js';
import type { NotificationRepository } from '../../../domain/repositories/NotificationRepository.js';
import type { NotificationSenderRegistry } from '../../ports/NotificationSenderRegistry.js';
import type { SendNotificationCommand } from './SendNotificationCommand.js';
import type { SendNotificationResult } from './SendNotificationResult.js';
import type { ApplicationError } from '../../ports/ApplicationError.js';
import {
  ChannelNotConfiguredError,
  InternalApplicationError,
  ValidationApplicationError,
} from '../../ports/ApplicationError.js';

export class SendNotificationHandler {
  constructor(
    private readonly notificationRepository: NotificationRepository,
    private readonly senderRegistry: NotificationSenderRegistry
  ) {}

  async execute(
    command: SendNotificationCommand
  ): Promise<Result<SendNotificationResult, ApplicationError>> {
    // Validate contact
    const contactResult = RecipientContact.create(command.channel, command.contact);
    if (contactResult.isErr()) {
      return err(new ValidationApplicationError(contactResult.error.message));
    }
    const contact = contactResult.value;

    // Create notification aggregate
    const notificationResult = Notification.create({
      recipientId: command.recipientId,
      contact,
      subject: command.subject,
      body: command.body,
      templateKey: command.templateKey,
      metadata: command.metadata,
    });
    if (notificationResult.isErr()) {
      return err(new ValidationApplicationError(notificationResult.error.message));
    }
    const notification = notificationResult.value;

    // Resolve sender
    const sender = this.senderRegistry.get(command.channel);
    if (!sender) {
      return err(new ChannelNotConfiguredError(command.channel));
    }

    // Send
    const sendResult = await sender.send(notification);
    if (sendResult.isErr()) {
      const failure = notification.markAsFailed(sendResult.error.message);
      if (failure.isErr()) {
        return err(new InternalApplicationError(failure.error.message));
      }
      await this.notificationRepository.save(notification);
      return ok({
        notificationId: notification.id.value,
        status: notification.status,
        channel: notification.channel,
        sentAt: null,
        errorMessage: notification.errorMessage,
      });
    }

    const sent = notification.markAsSent();
    if (sent.isErr()) {
      return err(new InternalApplicationError(sent.error.message));
    }
    await this.notificationRepository.save(notification);

    return ok({
      notificationId: notification.id.value,
      status: notification.status,
      channel: notification.channel,
      sentAt: notification.sentAt?.toISOString() ?? null,
      errorMessage: null,
    });
  }
}
