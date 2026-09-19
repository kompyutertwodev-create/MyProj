import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import { decodeJwt } from 'jose';
import { createContainer, type AppContainer } from '../src/container';
import { createServer } from '../src/server';

const databaseUrl = process.env['DATABASE_URL'];
if (!databaseUrl) throw new Error('DATABASE_URL is required for integration tests');

const password = 'PersistPass123!';

let server: Server;
let baseUrl: string;
let container: AppContainer;
let runCounter = 0;

interface Session {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
  roles: string[];
}

function freshEmail(): string {
  runCounter += 1;
  const rand = Math.random().toString(36).slice(2, 8);
  return `authz-test-${Date.now()}-${runCounter}-${rand}@example.com`;
}

async function request(
  path: string,
  init: RequestInit,
): Promise<{ status: number; body: Record<string, any> }> {
  const response = await fetch(`${baseUrl}${path}`, init);
  return { status: response.status, body: (await response.json()) as Record<string, any> };
}

async function registerFreshUser(): Promise<{ email: string; userId: string }> {
  const email = freshEmail();
  const res = await request('/api/v1/auth/register', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password, displayName: 'Authz Test' }),
  });
  expect(res.status).toBe(200);
  // RegisterUserResult exposes `userId` (not `id`).
  return { email, userId: res.body.data.userId };
}

async function login(email: string): Promise<Session> {
  const res = await request('/api/v1/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      deviceInfo: {
        deviceId: 'authz-test-device',
        deviceName: 'Vitest',
        deviceType: 'web',
        ipAddress: '127.0.0.1',
        userAgent: 'vitest',
      },
    }),
  });
  expect(res.status).toBe(200);
  return {
    accessToken: res.body.data.accessToken,
    refreshToken: res.body.data.refreshToken,
    sessionId: res.body.data.sessionId,
    roles: res.body.data.user.roles,
  };
}

function decodeRoles(accessToken: string): string[] {
  const payload = decodeJwt(accessToken) as { roles?: string[] };
  return payload.roles ?? [];
}

async function findRoleId(name: string): Promise<string> {
  const rolesResult = await container.accessControlContainer.listRoles.execute({
    page: 1,
    pageSize: 200,
  });
  expect(rolesResult.isOk()).toBe(true);
  if (rolesResult.isErr()) throw new Error('listRoles failed');
  const role = rolesResult.value.items.find((r) => r.name === name);
  if (!role) throw new Error(`role "${name}" not found`);
  return role.id;
}

async function assignRole(userId: string, roleId: string) {
  const result = await container.accessControlContainer.assignRole.execute({
    userId,
    roleId,
    assignedBy: userId, // Use the user's own ID as the assigner
  });
  if (result.isErr()) {
    console.error('[assignRole] error:', JSON.stringify(result.error, null, 2));
  }
  return result;
}

beforeAll(async () => {
  container = await createContainer({
    databaseUrl,
    startBackgroundWorkers: false,
    runMigrations: true,
  });
  const app = createServer(container);
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

describe('authorization integration (JWT roles claim)', () => {
  test('newly registered user gets an access token with empty roles', async () => {
    const { email } = await registerFreshUser();
    const session = await login(email);

    expect(session.roles).toEqual([]);
    expect(decodeRoles(session.accessToken)).toEqual([]);
  });

  test('refresh token rotation preserves the empty roles claim', async () => {
    const { email } = await registerFreshUser();
    const session = await login(email);
    const refreshed = await request('/api/v1/auth/refresh', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ refreshToken: session.refreshToken }),
    });

    expect(refreshed.status).toBe(200);
    expect(decodeRoles(refreshed.body.data.accessToken)).toEqual([]);
  });

  test('assigned role appears in the next access token', async () => {
    const { email, userId } = await registerFreshUser();
    const roleId = await findRoleId('user');

    const assignResult = await assignRole(userId, roleId);
    expect(assignResult.isOk()).toBe(true);

    const session = await login(email);
    expect(session.roles).toEqual(['user']);
    expect(decodeRoles(session.accessToken)).toEqual(['user']);
  });

  test('user DTO mirrors the JWT roles claim after assignment', async () => {
    const { email, userId } = await registerFreshUser();
    const roleId = await findRoleId('user');

    const assignResult = await assignRole(userId, roleId);
    expect(assignResult.isOk()).toBe(true);

    const session = await login(email);
    expect(session.roles.length).toBeGreaterThan(0);
    expect(decodeRoles(session.accessToken)).toEqual(session.roles);
  });
});