import type { UserRegisteredEvent } from '../../../domain/events/UserRegisteredEvent.js';
import type { Logger } from '@workspace/platform';

export class UserRegisteredEventHandler {
  constructor(private readonly logger: Logger) {}

  async handle(event: UserRegisteredEvent): Promise<void> {
    // Welcome email delivery belongs to notification; IAM only publishes the event.
    this.logger.info('User registered', {
      userId: event.userId,
      email: event.email,
    });
  }
}
