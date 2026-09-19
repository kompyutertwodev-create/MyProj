import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
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

before(async () => {
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

after(async () => {
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
  assert.equal(first.status, 200);
  assert.equal(first.body.success, true);
  assert.equal(first.body.data.email, email);

  const duplicate = await request('/api/v1/auth/register', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  assert.equal(duplicate.status, 409);
  assert.equal(duplicate.body.error.code, 'CONFLICT');
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
  assert.equal(login.status, 200);
  assert.equal(login.body.success, true);
  assert.match(login.body.data.accessToken, /^ey/);
  assert.match(login.body.data.refreshToken, /^ey/);
  assert.match(login.body.data.sessionId, /^[0-9a-f-]{36}$/);

  const refreshed = await request('/api/v1/auth/refresh', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ refreshToken: login.body.data.refreshToken }),
  });
  assert.equal(refreshed.status, 200);
  assert.equal(refreshed.body.success, true);
  assert.match(refreshed.body.data.accessToken, /^ey/);
  assert.match(refreshed.body.data.refreshToken, /^ey/);
  assert.notEqual(refreshed.body.data.refreshToken, login.body.data.refreshToken);

  const replay = await request('/api/v1/auth/refresh', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ refreshToken: login.body.data.refreshToken }),
  });
  assert.equal(replay.status, 401);
  assert.equal(replay.body.error.code, 'UNAUTHORIZED');

  const refreshedAgain = await request('/api/v1/auth/refresh', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ refreshToken: refreshed.body.data.refreshToken }),
  });
  assert.equal(refreshedAgain.status, 200);
  assert.notEqual(
    refreshedAgain.body.data.refreshToken,
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
  assert.equal(logout.status, 200);
  assert.equal(logout.body.success, true);

  const afterLogout = await request('/api/v1/auth/refresh', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ refreshToken: refreshedAgain.body.data.refreshToken }),
  });
  assert.equal(afterLogout.status, 401);
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
  assert.equal(invalidLogin.status, 401);
  assert.equal(invalidLogin.body.error.code, 'UNAUTHORIZED');

  const invalidRefresh = await request('/api/v1/auth/refresh', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ refreshToken: 'not-a-jwt' }),
  });
  assert.equal(invalidRefresh.status, 401);
  assert.equal(invalidRefresh.body.error.code, 'UNAUTHORIZED');

  const malformedRefresh = await request('/api/v1/auth/refresh', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({}),
  });
  assert.equal(malformedRefresh.status, 422);
  assert.equal(malformedRefresh.body.error.code, 'VALIDATION_ERROR');

  const malformed = await request('/api/v1/auth/register', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'not-an-email', password: 'short' }),
  });
  assert.equal(malformed.status, 422);
  assert.equal(malformed.body.error.code, 'VALIDATION_ERROR');
});