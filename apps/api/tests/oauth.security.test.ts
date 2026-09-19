import { afterAll, beforeAll, expect, test } from 'vitest';
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
  InMemorySessionRepository,
  InMemorySocialIdentityRepository,
} from '@workspace/iam';
import { OAuthProviderError } from '../../../modules/iam/src/application/ports/OAuthErrors.js';
import {
  Email,
  OAuthProvider,
  PasswordHash,
  User,
  UserStatus,
} from '../../../modules/iam/src/domain/index.js';
import { ok } from '@workspace/kernel';

const provider = {
  provider: 'google' as OAuthProvider,
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

beforeAll(async () => {
  const stateRepository = new InMemoryOAuthStateRepository();
  const registry = new OAuthProviderRegistry();
  registry.register(provider);

  const router = createOAuthRouter({
    providerRegistry: registry,
    stateRepository,
    initiateOAuth: {
      execute: async (command: { provider: string }) => {
        const state = `test-state-${command.provider}-${Date.now()}`;
        await stateRepository.save(
          state,
          command.provider as OAuthProvider,
          new Date(Date.now() + 10 * 60 * 1000),
        );
        return ok({
          authorizationUrl: `https://provider.example/authorize?state=${encodeURIComponent(state)}`,
          state,
          provider: command.provider as OAuthProvider,
        });
      },
    } as never,
    oauthLogin: {
      handle: async () => {
        throw new OAuthProviderError('Google', 'test exchange');
      },
    } as never,
    linkSocialAccount: { handle: async () => undefined } as never,
  });
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

afterAll(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test('stores OAuth state server-side and consumes it exactly once', async () => {
  const initiated = await request('/google');
  expect(initiated.status).toBe(302);

  const location = new URL(initiated.headers.get('location')!);
  const state = location.searchParams.get('state');
  const cookie = initiated.headers.get('set-cookie');
  expect(state).toBeTruthy();
  expect(cookie).toBeTruthy();

  const callback = await request(
    `/google/callback?code=provider-code&state=${encodeURIComponent(state!)}`,
    { headers: { cookie: cookie!.split(';')[0] } },
  );
  expect(callback.status).toBe(502);
  const callbackBody = (await callback.json()) as { error: { code: string } };
  expect(callbackBody.error.code).toBe('OAUTH_PROVIDER_ERROR');

  const replay = await request(
    `/google/callback?code=provider-code&state=${encodeURIComponent(state!)}`,
    { headers: { cookie: cookie!.split(';')[0] } },
  );
  expect(replay.status).toBe(400);
  const replayBody = (await replay.json()) as { error: { code: string } };
  expect(replayBody.error.code).toBe('OAUTH_STATE_INVALID');
});

test('rejects a valid OAuth state without its browser-bound cookie', async () => {
  const initiated = await request('/google');
  const locationHeader = initiated.headers.get('location');
  if (!locationHeader) {
    throw new Error('Expected redirect location header');
  }
  const location = new URL(locationHeader);
  const state = location.searchParams.get('state')!;

  const callback = await request(
    `/google/callback?code=provider-code&state=${encodeURIComponent(state)}`,
  );
  expect(callback.status).toBe(400);
  const body = (await callback.json()) as { error: { code: string } };
  expect(body.error.code).toBe('OAUTH_STATE_INVALID');
});

test('rejects an expired server-side OAuth state', async () => {
  const registry = new OAuthProviderRegistry();
  registry.register(provider);
  const expiredStateRepository = new InMemoryOAuthStateRepository();
  await expiredStateRepository.save(
    'expired-state',
    'google' as OAuthProvider,
    new Date(Date.now() - 1),
  );

  const router = createOAuthRouter({
    providerRegistry: registry,
    stateRepository: expiredStateRepository,
    initiateOAuth: {
      execute: async (command: { provider: string }) => {
        const state = `test-state-${command.provider}-${Date.now()}`;
        await expiredStateRepository.save(
          state,
          command.provider as OAuthProvider,
          new Date(Date.now() + 10 * 60 * 1000),
        );
        return ok({
          authorizationUrl: `https://provider.example/authorize?state=${encodeURIComponent(state)}`,
          state,
          provider: command.provider as OAuthProvider,
        });
      },
    } as never,
    oauthLogin: {
      handle: async () => {
        throw new OAuthProviderError('Google', 'test exchange');
      },
    } as never,
    linkSocialAccount: { handle: async () => undefined } as never,
  });
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
      { headers: { cookie: 'oauth_state=expired-state' } },
    );
    expect(callback.status).toBe(400);
    const body = (await callback.json()) as { error: { code: string } };
    expect(body.error.code).toBe('OAUTH_STATE_INVALID');
  } finally {
    await new Promise<void>((resolve, reject) => {
      isolatedServer.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test('requires absolute redirect URIs for OAuth providers', () => {
  expect(() =>
    new GoogleOAuthProvider({
      clientId: 'client',
      clientSecret: 'secret',
      redirectUri: '/api/v1/auth/oauth/google/callback',
    }),
  ).toThrow(/absolute URL/);
});

test('links a verified social email to the existing local user', async () => {
  const users = new InMemoryUserRepository();
  const sessions = new InMemorySessionRepository();
  const socialIdentities = new InMemorySocialIdentityRepository();

  const existingUser = User.create({
    email: Email.create('unified@example.com').getOrThrow(),
    passwordHash: PasswordHash.create('existing-password-hash'),
    displayName: 'Local User',
    status: UserStatus.Active,
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
  );

  const result = await handler.handle({
    provider: OAuthProvider.Google,
    code: 'provider-code',
    deviceInfo: { ipAddress: '127.0.0.1', userAgent: 'node:test' },
  });

  expect(result.isNewUser).toBe(false);
  expect(result.user.id).toBe(existingUser.id.value);
  expect(result.user.email).toBe('unified@example.com');
  const linked = await socialIdentities.findByProvider(
    OAuthProvider.Google,
    'google-user-1',
  );
  expect(linked?.userId).toBe(existingUser.id.value);
  const usersWithSameEmail = await users.findByEmail('unified@example.com');
  expect(usersWithSameEmail?.id.value).toBe(existingUser.id.value);
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
  );

  await expect(
    handler.handle({
      provider: OAuthProvider.GitHub,
      code: 'provider-code',
      deviceInfo: { ipAddress: '127.0.0.1', userAgent: 'node:test' },
    }),
  ).rejects.toThrow(/verified social email is required/);
});