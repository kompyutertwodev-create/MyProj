import { describe, it, expect, vi } from 'vitest';
import { LoginUserHandler } from '../LoginUserHandler.js';
import type { LoginUserCommand } from '../LoginUserCommand.js';
import { Email, PasswordHash, User, UserStatus } from '../../../../domain/index.js';
import { InMemoryUserRepository } from '../../../../infrastructure/repositories/InMemoryUserRepository.js';
import { InMemorySessionRepository } from '../../../../infrastructure/repositories/InMemorySessionRepository.js';
import { InMemoryIamEventBus } from '../../../../infrastructure/messaging/InMemoryIamEventBus.js';
import type { PasswordService } from '../../../../domain/index.js';
import type { DomainTokenService } from '../../../../domain/index.js';
import type { AuthorizationPort } from '../../../ports/AuthorizationPort.js';

const DEVICE_INFO = {
  deviceId: 'device-1',
  deviceName: 'Test',
  deviceType: 'web',
  ipAddress: '127.0.0.1',
  userAgent: 'vitest',
};

function makeCommand(overrides: Partial<LoginUserCommand> = {}): LoginUserCommand {
  return {
    email: 'user@example.com',
    password: 'CorrectPass123!',
    deviceInfo: DEVICE_INFO,
    ...overrides,
  };
}

async function makeUserRepository(email = 'user@example.com') {
  const users = new InMemoryUserRepository();
  const user = User.create({
    email: Email.create(email).getOrThrow(),
    passwordHash: PasswordHash.create('hashed-password'),
    displayName: 'Test User',
    status: UserStatus.Active,
  } as never).getOrThrow();
  await users.save(user);
  return { users, user };
}

function makePasswordService(valid = true): PasswordService {
  return { compare: vi.fn().mockResolvedValue(valid) } as unknown as PasswordService;
}

function makeTokenService() {
  const generateAccessToken = vi.fn(
    async (userId: string, roleNames: string[]) => `access:${userId}:${roleNames.join(',')}`,
  );
  const generateRefreshToken = vi.fn(
    async (userId: string, sessionId: string) => `refresh:${userId}:${sessionId}`,
  );
  return {
    service: { generateAccessToken, generateRefreshToken } as unknown as DomainTokenService,
    generateAccessToken,
    generateRefreshToken,
  };
}

function makeAuthorization(roleNames: string[] = []): AuthorizationPort {
  return {
    getRoleNames: vi.fn().mockResolvedValue(roleNames),
    checkPermission: vi.fn().mockResolvedValue({ allowed: false, reason: 'no_match' }),
  };
}

describe('LoginUserHandler (role claims)', () => {
  it('issues access token with empty roles when no authorization port is configured', async () => {
    const { users, user } = await makeUserRepository();
    const { service: tokens, generateAccessToken } = makeTokenService();
    const handler = new LoginUserHandler(
      users,
      new InMemorySessionRepository(),
      makePasswordService(),
      tokens,
      new InMemoryIamEventBus(),
    );

    const result = await handler.execute(makeCommand());

    expect(result.isOk()).toBe(true);
    expect(generateAccessToken).toHaveBeenCalledWith(user.id.value, []);
    if (result.isOk()) {
      expect(result.value.user.roles).toEqual([]);
      expect(result.value.accessToken).toBe(`access:${user.id.value}:`);
    }
  });

  it('calls authorization.getRoleNames with the authenticated user id', async () => {
    const { users, user } = await makeUserRepository();
    const { service: tokens } = makeTokenService();
    const authorization = makeAuthorization(['admin']);

    const handler = new LoginUserHandler(
      users,
      new InMemorySessionRepository(),
      makePasswordService(),
      tokens,
      new InMemoryIamEventBus(),
      undefined,
      authorization,
    );

    await handler.execute(makeCommand());

    expect(authorization.getRoleNames).toHaveBeenCalledWith(user.id.value);
  });

  it('forwards role names from authorization to the access token', async () => {
    const { users, user } = await makeUserRepository();
    const { service: tokens, generateAccessToken } = makeTokenService();
    const authorization = makeAuthorization(['admin', 'user']);

    const handler = new LoginUserHandler(
      users,
      new InMemorySessionRepository(),
      makePasswordService(),
      tokens,
      new InMemoryIamEventBus(),
      undefined,
      authorization,
    );

    const result = await handler.execute(makeCommand());

    expect(generateAccessToken).toHaveBeenCalledWith(user.id.value, ['admin', 'user']);
    if (result.isOk()) {
      expect(result.value.accessToken).toBe(`access:${user.id.value}:admin,user`);
      expect(result.value.user.roles).toEqual(['admin', 'user']);
    }
  });

  it('returns empty roles when authorization resolves an empty list', async () => {
    const { users, user } = await makeUserRepository();
    const { service: tokens, generateAccessToken } = makeTokenService();
    const authorization = makeAuthorization([]);

    const handler = new LoginUserHandler(
      users,
      new InMemorySessionRepository(),
      makePasswordService(),
      tokens,
      new InMemoryIamEventBus(),
      undefined,
      authorization,
    );

    const result = await handler.execute(makeCommand());

    expect(generateAccessToken).toHaveBeenCalledWith(user.id.value, []);
    if (result.isOk()) {
      expect(result.value.user.roles).toEqual([]);
    }
  });

  it('exposes the same roles in the result and the token', async () => {
    const { users } = await makeUserRepository();
    const { service: tokens, generateAccessToken } = makeTokenService();
    const authorization = makeAuthorization(['moderator']);

    const handler = new LoginUserHandler(
      users,
      new InMemorySessionRepository(),
      makePasswordService(),
      tokens,
      new InMemoryIamEventBus(),
      undefined,
      authorization,
    );

    const result = await handler.execute(makeCommand());

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.user.roles).toEqual(['moderator']);
    }
    const callArgs = generateAccessToken.mock.calls[0];
    expect(callArgs?.[1]).toEqual(['moderator']);
  });

  it('deny-by-default: returns empty roles when authorization throws', async () => {
    const { users } = await makeUserRepository();
    const { service: tokens } = makeTokenService();
    const authorization = {
      getRoleNames: vi.fn().mockRejectedValue(new Error('access-control down')),
      checkPermission: vi.fn(),
    } as unknown as AuthorizationPort;

    const handler = new LoginUserHandler(
      users,
      new InMemorySessionRepository(),
      makePasswordService(),
      tokens,
      new InMemoryIamEventBus(),
      undefined,
      authorization,
    );

    await expect(handler.execute(makeCommand())).rejects.toThrow('access-control down');
  });

  it('deny-by-default: invalid credentials never call authorization', async () => {
    const { users } = await makeUserRepository();
    const { service: tokens } = makeTokenService();
    const authorization = makeAuthorization(['admin']);

    const handler = new LoginUserHandler(
      users,
      new InMemorySessionRepository(),
      makePasswordService(false),
      tokens,
      new InMemoryIamEventBus(),
      undefined,
      authorization,
    );

    const result = await handler.execute(makeCommand({ password: 'wrong' }));

    expect(result.isErr()).toBe(true);
    expect(authorization.getRoleNames).not.toHaveBeenCalled();
  });
});