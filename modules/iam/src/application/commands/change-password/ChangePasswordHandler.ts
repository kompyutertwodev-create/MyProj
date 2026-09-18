import type { Result } from '@workspace/kernel';
import { err, ok } from '@workspace/kernel';
import { PasswordHash } from '../../../domain/index.js';
import type { UserRepository, PasswordService } from '../../../domain/index.js';
import type { ChangePasswordCommand } from './ChangePasswordCommand.js';
import type { ApplicationError } from '../../ports/ApplicationError.js';
import {
  NotFoundApplicationError,
  UnauthorizedApplicationError,
  ValidationApplicationError,
} from '../../ports/ApplicationError.js';
import type { EventBusPort } from '../../ports/EventBusPort.js';

export class ChangePasswordHandler {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordService: PasswordService,
    private readonly eventBus: EventBusPort
  ) {}

  async execute(command: ChangePasswordCommand): Promise<Result<void, ApplicationError>> {
    const user = await this.userRepository.findById(command.userId);
    if (!user) {
      return err(new NotFoundApplicationError(`User "${command.userId}" not found`));
    }

    const currentValid = await this.passwordService.compare(
      command.currentPassword,
      user.passwordHash.value
    );
    if (!currentValid) {
      return err(new UnauthorizedApplicationError('Current password is incorrect'));
    }

    const strengthResult = this.passwordService.validateStrength(command.newPassword);
    if (strengthResult.isErr()) {
      return err(new ValidationApplicationError(strengthResult.error.message));
    }

    const newHash = await this.passwordService.hash(command.newPassword);
    user.changePassword(PasswordHash.create(newHash));
    await this.userRepository.save(user);

    const events = user.pullDomainEvents();
    for (const event of events) {
      await this.eventBus.publish(event);
    }

    return ok(undefined);
  }
}
