import { afterAll, beforeAll, expect, test } from 'vitest';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import { createContainer } from '../src/container';
import { createServer } from '../src/server';

const databaseUrl = process.env['DATABASE_URL'];
if (!databaseUrl) throw new Error('DATABASE_URL is required for integration tests');

const password = 'PersistPass123!';
const email = `auth-test-${Date.now()}@example.com`;
let server: Server;
let baseUrl: string;

async function request(
  path: string,
  init: RequestInit,
): Promise<{ status: number; body: Record<string, any> }> {
  const response = await fetch(`${baseUrl}${path}`, init);
  return { status: response.status, body: (await response.json()) as Record<string, any> };
}

beforeAll(async () => {
  const app = createServer(
    await createContainer({
      databaseUrl,
      startBackgroundWorkers: false,
      runMigrations: true,
    }),
  );
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

test('registers an active account and rejects duplicates', async () => {
  const payload = { email, password, displayName: 'Auth Integration Test' };
  const first = await request('/api/v1/auth/register', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  expect(first.status).toBe(200);
  expect(first.body.success).toBe(true);
  expect(first.body.data.email).toBe(email);

  const duplicate = await request('/api/v1/auth/register', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  expect(duplicate.status).toBe(409);
  expect(duplicate.body.error.code).toBe('CONFLICT');
});

test('logs in, creates a persistent session, and logs out', async () => {
  const login = await request('/api/v1/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      deviceInfo: {
        deviceId: 'integration-device',
        deviceName: 'Node test',
        deviceType: 'web',
        ipAddress: '127.0.0.1',
        userAgent: 'node:test',
      },
    }),
  });
  expect(login.status).toBe(200);
  expect(login.body.success).toBe(true);
  expect(login.body.data.accessToken).toMatch(/^ey/);
  expect(login.body.data.refreshToken).toMatch(/^ey/);
  expect(login.body.data.sessionId).toMatch(/^[0-9a-f-]{36}$/);

  const refreshed = await request('/api/v1/auth/refresh', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ refreshToken: login.body.data.refreshToken }),
  });
  expect(refreshed.status).toBe(200);
  expect(refreshed.body.success).toBe(true);
  expect(refreshed.body.data.accessToken).toMatch(/^ey/);
  expect(refreshed.body.data.refreshToken).toMatch(/^ey/);
  expect(refreshed.body.data.refreshToken).not.toBe(login.body.data.refreshToken);

  const replay = await request('/api/v1/auth/refresh', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ refreshToken: login.body.data.refreshToken }),
  });
  expect(replay.status).toBe(401);
  expect(replay.body.error.code).toBe('UNAUTHORIZED');

  const refreshedAgain = await request('/api/v1/auth/refresh', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ refreshToken: refreshed.body.data.refreshToken }),
  });
  expect(refreshedAgain.status).toBe(200);
  expect(refreshedAgain.body.data.refreshToken).not.toBe(
    refreshed.body.data.refreshToken,
  );
  const logout = await request('/api/v1/auth/logout', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${refreshedAgain.body.data.accessToken}`,
    },
    body: JSON.stringify({ sessionId: login.body.data.sessionId }),
  });
  expect(logout.status).toBe(200);
  expect(logout.body.success).toBe(true);
  const afterLogout = await request('/api/v1/auth/refresh', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ refreshToken: refreshedAgain.body.data.refreshToken }),
  });
  expect(afterLogout.status).toBe(401);
});

test('rejects invalid credentials and malformed requests', async () => {
  const invalidLogin = await request('/api/v1/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      email,
      password: 'wrong-password',
      deviceInfo: {
        deviceId: 'integration-device',
        deviceName: 'Node test',
        deviceType: 'web',
        ipAddress: '127.0.0.1',
        userAgent: 'node:test',
      },
    }),
  });
  expect(invalidLogin.status).toBe(401);
  expect(invalidLogin.body.error.code).toBe('UNAUTHORIZED');

  const invalidRefresh = await request('/api/v1/auth/refresh', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ refreshToken: 'not-a-jwt' }),
  });
  expect(invalidRefresh.status).toBe(401);
  expect(invalidRefresh.body.error.code).toBe('UNAUTHORIZED');

  const malformedRefresh = await request('/api/v1/auth/refresh', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({}),
  });
  expect(malformedRefresh.status).toBe(422);
  expect(malformedRefresh.body.error.code).toBe('VALIDATION_ERROR');

  const malformed = await request('/api/v1/auth/register', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'not-an-email', password: 'short' }),
  });
  expect(malformed.status).toBe(422);
  expect(malformed.body.error.code).toBe('VALIDATION_ERROR');
});