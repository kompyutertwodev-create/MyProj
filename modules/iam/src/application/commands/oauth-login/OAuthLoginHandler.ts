import type { OAuthLoginCommand } from './OAuthLoginCommand.js';
import type { OAuthLoginResult } from './OAuthLoginResult.js';
import type { OAuthProviderRegistry } from '../../strategies/OAuthProviderRegistry.js';
import type { OAuthProviderPort } from '../../strategies/OAuthProviderPort.js';
import type { SocialIdentityRepository } from '../../../domain/oauth/SocialIdentityRepository.js';
import type { UserRepository } from '../../../domain/repositories/UserRepository.js';
import type { SessionRepository } from '../../../domain/repositories/SessionRepository.js';
import type { DomainTokenService as TokenService } from '../../../domain/domain-services/TokenService.js';
import type { PasswordService } from '../../../domain/domain-services/PasswordService.js';
import { SocialIdentity } from '../../../domain/oauth/SocialIdentity.js';
import { User } from '../../../domain/User.js';
import { Email } from '../../../domain/Email.js';
import { PasswordHash } from '../../../domain/PasswordHash.js';
import { Session } from '../../../domain/Session.js';
import { SessionId } from '../../../domain/SessionId.js';
import { UserStatus } from '../../../domain/UserStatus.js';
import { randomUUID } from 'node:crypto';
import type { IamTransactionContext, IamUnitOfWork } from '../../ports/IamUnitOfWork.js';
import { OAuthAuthenticationError } from '../../ports/OAuthErrors.js';
import { sha256Hex, type DomainEvent } from '@workspace/kernel';
import type { EventBusPort } from '../../ports/EventBusPort.js';

const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;

/**
 * OAuth login / sign-up handler.
 *
 * RBAC is not consulted here: role assignment for newly created users is
 * delegated to @workspace/access-control (through an event handler that
 * reacts to UserRegisteredEvent). The access token is minted with an empty
 * role list for now вЂ” deny-by-default until the AuthorizationPort wiring
 * lands.
 */
export class OAuthLoginHandler {
  constructor(
    private readonly providerRegistry: OAuthProviderRegistry,
    private readonly socialIdentityRepo: SocialIdentityRepository,
    private readonly userRepo: UserRepository,
    private readonly sessionRepo: SessionRepository,
    private readonly tokenService: TokenService,
    private readonly passwordService: PasswordService,
    private readonly unitOfWork?: IamUnitOfWork,
    private readonly eventBus?: EventBusPort,
  ) {}

  async handle(command: OAuthLoginCommand): Promise<OAuthLoginResult> {
    const adapter = this.providerRegistry.get(command.provider);
    const profile = await adapter.exchangeCode(command.code, command.state);
    if (profile.email && !profile.emailVerified) {
      throw new OAuthAuthenticationError('A verified social email is required');
    }

    const events: DomainEvent[] = [];
    const result = this.unitOfWork
      ? await this.unitOfWork.run((context) =>
          this.handleProfile(command, profile, context, events),
        )
      : await this.handleProfile(
          command,
          profile,
          {
            users: this.userRepo,
            sessions: this.sessionRepo,
            socialIdentities: this.socialIdentityRepo,
            outbox: undefined as never,
          },
          events,
        );

    if (this.eventBus && !this.unitOfWork) {
      await this.eventBus.publishAll(events);
    }
    return result;
  }

  private async handleProfile(
    command: OAuthLoginCommand,
    profile: Awaited<ReturnType<OAuthProviderPort['exchangeCode']>>,
    context: IamTransactionContext,
    events: DomainEvent[],
  ): Promise<OAuthLoginResult> {
    let socialIdentity = await context.socialIdentities.findByProvider(
      command.provider,
      profile.providerUserId,
    );

    let user: User;
    let isNewUser = false;

    if (socialIdentity) {
      const found = await context.users.findById(socialIdentity.userId);
      if (!found) {
        throw new Error('Linked user not found вЂ” data integrity issue');
      }
      user = found;
      socialIdentity.updateProfile(profile.email, profile.displayName);
      await context.socialIdentities.save(socialIdentity);
    } else {
      let existingUser: User | null = null;
      if (profile.email) {
        const emailVo = Email.create(profile.email);
        if (emailVo.isOk()) {
          existingUser = await context.users.findByEmail(emailVo.value.value);
        }
      }

      if (existingUser) {
        user = existingUser;
      } else {
        isNewUser = true;
        const emailVo = profile.email
          ? Email.create(profile.email)
          : ({ isOk: () => false as const, value: undefined } as const);

        if (!emailVo.isOk() && !profile.email) {
          const placeholder = `${command.provider}.${profile.providerUserId}@social.local`;
          user = await this.createUser(
            context.users,
            Email.create(placeholder).getOrThrow(),
            profile.displayName,
            profile.avatarUrl,
          );
        } else {
          user = await this.createUser(
            context.users,
            (emailVo as { getOrThrow: () => Email }).getOrThrow(),
            profile.displayName,
            profile.avatarUrl,
          );
        }
      }

      socialIdentity = SocialIdentity.create(
        user.id.value,
        command.provider,
        profile.providerUserId,
        profile.email,
        profile.displayName,
      );
      await context.socialIdentities.save(socialIdentity);
    }

    // RBAC lives in access-control; tokens carry no role claims yet.
    const roleNames: string[] = [];
    const accessToken = await this.tokenService.generateAccessToken(
      user.id.value,
      roleNames,
    );

    const di = command.deviceInfo ?? {};
    const sessionId = new SessionId();
    const refreshToken = await this.tokenService.generateRefreshToken(
      user.id.value,
      sessionId.value,
    );
    const refreshTokenHash = sha256Hex(refreshToken);
    const session = Session.create(sessionId, {
      userId: user.id.value,
      deviceId: di.deviceId ?? 'unknown',
      deviceName: di.deviceName ?? 'OAuth',
      deviceType: di.deviceType ?? 'web',
      ipAddress: di.ipAddress ?? 'unknown',
      userAgent: di.userAgent ?? 'unknown',
      refreshTokenHash,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      lastActiveAt: new Date(),
      createdAt: new Date(),
    });
    await context.sessions.save(session);
    user.addSession(session);

    const pendingEvents = user.pullDomainEvents();
    if (context.outbox) {
      await context.outbox.enqueueAll(pendingEvents);
    } else {
      events.push(...pendingEvents);
    }

    return {
      accessToken,
      refreshToken,
      sessionId: session.id.value,
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
      isNewUser,
      user: {
        id: user.id.value,
        email: user.email.value,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        roles: roleNames,
      },
    };
  }

  private async createUser(
    userRepo: UserRepository,
    email: Email,
    displayName: string,
    avatarUrl: string | null,
  ): Promise<User> {
    const randomPassword = randomUUID();
    const hash = await this.passwordService.hash(randomPassword);
    const passwordHash = PasswordHash.create(hash);

    const result = User.create({
      email,
      passwordHash,
      passwordSet: false,
      displayName,
      avatarUrl: avatarUrl ?? null,
      status: UserStatus.Active,
    });
    if (result.isErr()) throw result.error;

    await userRepo.save(result.value);
    return result.value;
  }
}