import type { DomainEvent, Result } from '@workspace/kernel';
import { err, ok } from '@workspace/kernel';
import { Email, Session, SessionId } from '../../../domain/index.js';
import type {
  UserRepository,
  SessionRepository,
  PasswordService,
  DomainTokenService,
} from '../../../domain/index.js';
import type { LoginUserCommand } from './LoginUserCommand.js';
import type { LoginUserResult } from './LoginUserResult.js';
import type { ApplicationError } from '../../ports/ApplicationError.js';
import {
  UnauthorizedApplicationError,
  ValidationApplicationError,
} from '../../ports/ApplicationError.js';
import type { EventBusPort } from '../../ports/EventBusPort.js';
import type { IamTransactionContext, IamUnitOfWork } from '../../ports/IamUnitOfWork.js';

const ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export class LoginUserHandler {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly sessionRepository: SessionRepository,
    private readonly passwordService: PasswordService,
    private readonly tokenService: DomainTokenService,
    private readonly eventBus: EventBusPort,
    private readonly unitOfWork?: IamUnitOfWork
  ) {}

  async execute(command: LoginUserCommand): Promise<Result<LoginUserResult, ApplicationError>> {
    const events: DomainEvent[] = [];
    const result = this.unitOfWork
      ? await this.unitOfWork.run((context) =>
          this.executeWithRepositories(command, context, events)
        )
      : await this.executeWithRepositories(
          command,
          {
            users: this.userRepository,
            roles: undefined as never,
            sessions: this.sessionRepository,
            socialIdentities: undefined as never,
            outbox: undefined as never,
          },
          events
        );

    if (!this.unitOfWork) {
      await this.eventBus.publishAll(events);
    }
    return result;
  }

  private async executeWithRepositories(
    command: LoginUserCommand,
    context: IamTransactionContext,
    events: DomainEvent[]
  ): Promise<Result<LoginUserResult, ApplicationError>> {
    const emailResult = Email.create(command.email);
    if (emailResult.isErr()) {
      return err(new ValidationApplicationError(emailResult.error.message));
    }

    const user = await context.users.findByEmail(emailResult.value.value);
    if (!user) {
      return err(new UnauthorizedApplicationError('Invalid credentials'));
    }

    const passwordValid = await this.passwordService.compare(
      command.password,
      user.passwordHash.value
    );
    if (!passwordValid) {
      return err(new UnauthorizedApplicationError('Invalid credentials'));
    }

    if (!user.isActive()) {
      return err(new UnauthorizedApplicationError(`Account is ${user.status}`));
    }

    // Generate tokens
    const roleNames = user.roles.map((r) => r.name.value);
    const accessToken = await this.tokenService.generateAccessToken(user.id.value, roleNames);

    // Create session
    const now = new Date();
    const expiresAt = new Date(now.getTime() + REFRESH_TOKEN_TTL_MS);
    const sessionId = new SessionId();
    const refreshToken = await this.tokenService.generateRefreshToken(
      user.id.value,
      sessionId.value
    );
    const session = Session.create(sessionId, {
      userId: user.id.value,
      deviceId: command.deviceInfo.deviceId,
      deviceName: command.deviceInfo.deviceName,
      deviceType: command.deviceInfo.deviceType,
      ipAddress: command.deviceInfo.ipAddress,
      userAgent: command.deviceInfo.userAgent,
      refreshToken,
      expiresAt,
      lastActiveAt: now,
      createdAt: now,
    });

    await context.sessions.save(session);

    // Raise domain event via user
    user.addSession(session);
    const pendingEvents = user.pullDomainEvents();
    if (context.outbox) {
      await context.outbox.enqueueAll(pendingEvents);
    } else {
      events.push(...pendingEvents);
    }

    return ok({
      accessToken,
      refreshToken,
      sessionId: session.id.value,
      user: {
        id: user.id.value,
        email: user.email.value,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        status: user.status,
        roles: roleNames,
      },
    });
  }
}
