import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import express from 'express';
import cookieParser from 'cookie-parser';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import {
  createOAuthRouter,
  GoogleOAuthProvider,
  InMemoryOAuthStateRepository,
  OAuthProviderRegistry,
  OAuthLoginHandler,
  InMemoryUserRepository,
  InMemoryRoleRepository,
  InMemorySessionRepository,
  InMemorySocialIdentityRepository,
} from '@workspace/iam';
import { OAuthProviderError } from '../../../modules/iam/src/application/ports/OAuthErrors.js';
import {
  Email,
  OAuthProvider,
  PasswordHash,
  Permission,
  Role,
  RoleId,
  RoleName,
  User,
  UserStatus,
} from '../../../modules/iam/src/domain/index.js';

const provider = {
  provider: 'google',
  getRedirectUri: () => 'https://example.com/api/v1/auth/oauth/google/callback',
  getAuthorizationUrl: (state: string) =>
    `https://provider.example/authorize?state=${encodeURIComponent(state)}`,
  exchangeCode: async () => {
    throw new OAuthProviderError('Google', 'test exchange');
  },
};

let server: Server;
let baseUrl: string;

async function request(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${baseUrl}${path}`, { redirect: 'manual', ...init });
}

before(async () => {
  const registry = new OAuthProviderRegistry();
  registry.register(provider);

  const router = createOAuthRouter(
    registry,
    new InMemoryOAuthStateRepository(),
    {
      handle: async () => {
        throw new OAuthProviderError('Google', 'test exchange');
      },
    } as never,
    { handle: async () => undefined } as never
  );
  const app = express();
  app.use(cookieParser());
  app.use(express.json());
  app.use(router);

  server = await new Promise<Server>((resolve) => {
    const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
  });
  const address = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test('stores OAuth state server-side and consumes it exactly once', async () => {
  const initiated = await request('/google');
  assert.equal(initiated.status, 302);

  const location = new URL(initiated.headers.get('location')!);
  const state = location.searchParams.get('state');
  const cookie = initiated.headers.get('set-cookie');
  assert.ok(state);
  assert.ok(cookie);

  const callback = await request(
    `/google/callback?code=provider-code&state=${encodeURIComponent(state!)}`,
    {
      headers: { cookie: cookie!.split(';')[0] },
    }
  );
  assert.equal(callback.status, 502);
  assert.equal((await callback.json()).error.code, 'OAUTH_PROVIDER_ERROR');

  const replay = await request(
    `/google/callback?code=provider-code&state=${encodeURIComponent(state!)}`,
    {
      headers: { cookie: cookie!.split(';')[0] },
    }
  );
  assert.equal(replay.status, 400);
  assert.equal((await replay.json()).error.code, 'OAUTH_STATE_INVALID');
});

test('rejects a valid OAuth state without its browser-bound cookie', async () => {
  const initiated = await request('/google');
  const location = new URL(initiated.headers.get('location')!);
  const state = location.searchParams.get('state')!;

  const callback = await request(
    `/google/callback?code=provider-code&state=${encodeURIComponent(state)}`
  );
  assert.equal(callback.status, 400);
  assert.equal((await callback.json()).error.code, 'OAUTH_STATE_INVALID');
});

test('rejects an expired server-side OAuth state', async () => {
  const registry = new OAuthProviderRegistry();
  registry.register(provider);
  const stateRepository = new InMemoryOAuthStateRepository();
  await stateRepository.save('expired-state', 'google', new Date(Date.now() - 1));

  const router = createOAuthRouter(
    registry,
    stateRepository,
    { handle: async () => ({}) } as never,
    { handle: async () => undefined } as never
  );
  const app = express();
  app.use(cookieParser());
  app.use(router);
  const isolatedServer = await new Promise<Server>((resolve) => {
    const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
  });
  const isolatedAddress = isolatedServer.address() as AddressInfo;

  try {
    const callback = await fetch(
      `http://127.0.0.1:${isolatedAddress.port}/google/callback?code=code&state=expired-state`,
      { headers: { cookie: 'oauth_state=expired-state' } }
    );
    assert.equal(callback.status, 400);
    assert.equal((await callback.json()).error.code, 'OAUTH_STATE_INVALID');
  } finally {
    await new Promise<void>((resolve, reject) => {
      isolatedServer.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test('requires absolute redirect URIs for OAuth providers', () => {
  assert.throws(
    () =>
      new GoogleOAuthProvider({
        clientId: 'client',
        clientSecret: 'secret',
        redirectUri: '/api/v1/auth/oauth/google/callback',
      }),
    /absolute URL/
  );
});

test('links a verified social email to the existing local user', async () => {
  const users = new InMemoryUserRepository();
  const roles = new InMemoryRoleRepository();
  const sessions = new InMemorySessionRepository();
  const socialIdentities = new InMemorySocialIdentityRepository();
  const role = Role.create(new RoleId('role-user'), {
    name: RoleName.create('user').getOrThrow(),
    description: 'Standard user',
    permissions: [Permission.create('content:read', 'Read content').getOrThrow()],
    isSystem: true,
  });
  await roles.save(role);

  const existingUser = User.create({
    email: Email.create('unified@example.com').getOrThrow(),
    passwordHash: PasswordHash.create('existing-password-hash'),
    displayName: 'Local User',
    status: UserStatus.Active,
    roles: [role],
  }).getOrThrow();
  await users.save(existingUser);

  const registry = new OAuthProviderRegistry();
  registry.register({
    provider: OAuthProvider.Google,
    getRedirectUri: () => 'https://example.com/callback',
    getAuthorizationUrl: (state: string) => `https://example.com/oauth?state=${state}`,
    exchangeCode: async () => ({
      provider: OAuthProvider.Google,
      providerUserId: 'google-user-1',
      email: 'unified@example.com',
      emailVerified: true,
      displayName: 'Google User',
      avatarUrl: null,
      raw: {},
    }),
  });
  const tokenService = {
    generateAccessToken: async (userId: string, roleNames: string[]) =>
      `access:${userId}:${roleNames.join(',')}`,
    generateRefreshToken: async (userId: string, sessionId: string) =>
      `refresh:${userId}:${sessionId}`,
  } as never;
  const passwordService = {
    hash: async () => 'hash',
  } as never;
  const handler = new OAuthLoginHandler(
    registry,
    socialIdentities,
    users,
    sessions,
    tokenService,
    passwordService,
    roles
  );

  const result = await handler.handle({
    provider: OAuthProvider.Google,
    code: 'provider-code',
    deviceInfo: { ipAddress: '127.0.0.1', userAgent: 'node:test' },
  });

  assert.equal(result.isNewUser, false);
  assert.equal(result.user.id, existingUser.id.value);
  assert.equal(result.user.email, 'unified@example.com');
  const linked = await socialIdentities.findByProvider(OAuthProvider.Google, 'google-user-1');
  assert.equal(linked?.userId, existingUser.id.value);
  const usersWithSameEmail = await users.findByEmail('unified@example.com');
  assert.equal(usersWithSameEmail?.id.value, existingUser.id.value);
});

test('does not auto-merge an unverified social email', async () => {
  const registry = new OAuthProviderRegistry();
  registry.register({
    provider: OAuthProvider.GitHub,
    getRedirectUri: () => 'https://example.com/callback',
    getAuthorizationUrl: () => 'https://example.com/oauth',
    exchangeCode: async () => ({
      provider: OAuthProvider.GitHub,
      providerUserId: 'github-user-1',
      email: 'unverified@example.com',
      emailVerified: false,
      displayName: 'Unverified User',
      avatarUrl: null,
      raw: {},
    }),
  });
  const handler = new OAuthLoginHandler(
    registry,
    new InMemorySocialIdentityRepository(),
    new InMemoryUserRepository(),
    new InMemorySessionRepository(),
    {
      generateAccessToken: async () => 'access',
      generateRefreshToken: async () => 'refresh',
    } as never,
    { hash: async () => 'hash' } as never,
    new InMemoryRoleRepository()
  );

  await assert.rejects(
    handler.handle({
      provider: OAuthProvider.GitHub,
      code: 'provider-code',
      deviceInfo: { ipAddress: '127.0.0.1', userAgent: 'node:test' },
    }),
    /verified social email is required/
  );
});
