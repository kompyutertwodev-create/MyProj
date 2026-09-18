import type { OAuthLoginCommand } from './OAuthLoginCommand.js';
import type { OAuthLoginResult } from './OAuthLoginResult.js';
import type { OAuthProviderRegistry } from '../../strategies/OAuthProviderRegistry.js';
import type { OAuthProviderPort } from '../../strategies/OAuthProviderPort.js';
import type { SocialIdentityRepository } from '../../../domain/oauth/SocialIdentityRepository.js';
import type { UserRepository } from '../../../domain/repositories/UserRepository.js';
import type { RoleRepository } from '../../../domain/repositories/RoleRepository.js';
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
import type { DomainEvent } from '@workspace/kernel';
import type { EventBusPort } from '../../ports/EventBusPort.js';

export class OAuthLoginHandler {
  constructor(
    private readonly providerRegistry: OAuthProviderRegistry,
    private readonly socialIdentityRepo: SocialIdentityRepository,
    private readonly userRepo: UserRepository,
    private readonly sessionRepo: SessionRepository,
    private readonly tokenService: TokenService,
    private readonly passwordService: PasswordService,
    private readonly roleRepository: RoleRepository,
    private readonly unitOfWork?: IamUnitOfWork,
    private readonly eventBus?: EventBusPort
  ) {}

  async handle(command: OAuthLoginCommand): Promise<OAuthLoginResult> {
    // 1. Exchange authorization code → normalized profile
    const adapter = this.providerRegistry.get(command.provider);
    const profile = await adapter.exchangeCode(command.code, command.state);
    if (profile.email && !profile.emailVerified) {
      throw new OAuthAuthenticationError('A verified social email is required');
    }
    const events: DomainEvent[] = [];
    const result = this.unitOfWork
      ? await this.unitOfWork.run((context) =>
          this.handleProfile(command, profile, context, events)
        )
      : await this.handleProfile(
          command,
          profile,
          {
            users: this.userRepo,
            roles: this.roleRepository,
            sessions: this.sessionRepo,
            socialIdentities: this.socialIdentityRepo,
            outbox: undefined as never,
          },
          events
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
    events: DomainEvent[]
  ): Promise<OAuthLoginResult> {
    // 2. Look up existing social identity
    let socialIdentity = await context.socialIdentities.findByProvider(
      command.provider,
      profile.providerUserId
    );

    let user: User;
    let isNewUser = false;

    if (socialIdentity) {
      // 3a. Existing linked user — load it
      const found = await context.users.findById(socialIdentity.userId);
      if (!found) throw new Error('Linked user not found — data integrity issue');
      user = found;
      socialIdentity.updateProfile(profile.email, profile.displayName);
      await context.socialIdentities.save(socialIdentity);
    } else {
      // 3b. No existing social identity — find user by email or create new
      let existingUser: User | null = null;
      if (profile.email) {
        const emailVo = Email.create(profile.email);
        if (emailVo.isOk()) {
          existingUser = await context.users.findByEmail(emailVo.value.value);
        }
      }

      if (existingUser) {
        // Link this provider to the existing account
        user = existingUser;
      } else {
        // Create a brand-new user
        isNewUser = true;
        const emailVo = profile.email
          ? Email.create(profile.email)
          : { isOk: () => false as const, value: undefined };

        if (!emailVo.isOk() && !profile.email) {
          // Providers that don't expose email (e.g. Telegram) — generate a placeholder
          const placeholder = `${command.provider}.${profile.providerUserId}@social.local`;
          const result = await this.createUser(
            context.users,
            context.roles,
            Email.create(placeholder).getOrThrow(),
            profile.displayName,
            profile.avatarUrl
          );
          user = result;
        } else {
          const result = await this.createUser(
            context.users,
            context.roles,
            (emailVo as { isOk: () => true; value: Email; getOrThrow: () => Email }).getOrThrow(),
            profile.displayName,
            profile.avatarUrl
          );
          user = result;
        }
      }

      // Create social identity link
      socialIdentity = SocialIdentity.create(
        user.id.value,
        command.provider,
        profile.providerUserId,
        profile.email,
        profile.displayName
      );
      await context.socialIdentities.save(socialIdentity);
    }

    // 4. Issue tokens
    const roles = user.roles.map((r) => r.name.value);
    const accessToken = await this.tokenService.generateAccessToken(user.id.value, roles);

    // 5. Create session
    const di = command.deviceInfo ?? {};
    const sessionId = new SessionId();
    const refreshToken = await this.tokenService.generateRefreshToken(
      user.id.value,
      sessionId.value
    );
    const session = Session.create(sessionId, {
      userId: user.id.value,
      deviceId: di.deviceId ?? randomUUID(),
      deviceName: di.deviceName ?? 'OAuth',
      deviceType: di.deviceType ?? 'web',
      ipAddress: di.ipAddress ?? 'unknown',
      userAgent: di.userAgent ?? 'unknown',
      refreshToken,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
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
      expiresIn: 900,
      isNewUser,
      user: {
        id: user.id.value,
        email: user.email.value,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        roles,
      },
    };
  }

  private async createUser(
    userRepo: UserRepository,
    roleRepo: RoleRepository,
    email: Email,
    displayName: string,
    avatarUrl: string | null
  ): Promise<User> {
    // OAuth users have no password — generate a random secure hash
    const randomPassword = randomUUID();
    const hash = await this.passwordService.hash(randomPassword);
    const passwordHash = PasswordHash.create(hash);

    const result = User.create({
      email,
      passwordHash,
      passwordSet: false,
      displayName,
      avatarUrl: avatarUrl ?? null,
      status: UserStatus.Active, // OAuth-verified users are immediately active
    });
    if (result.isErr()) throw result.error;
    const defaultRole = await roleRepo.findByName('user');
    if (!defaultRole) throw new Error('Default user role is not configured');
    const roleAssignment = result.value.assignRole(defaultRole);
    if (roleAssignment.isErr()) throw roleAssignment.error;

    await userRepo.save(result.value);
    await userRepo.assignRole(result.value.id.value, defaultRole);
    return result.value;
  }
}
