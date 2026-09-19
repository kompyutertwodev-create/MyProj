import { afterAll, beforeAll, expect, test } from 'vitest';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import express, { type Express } from 'express';
import { security } from '../src/middleware/security.js';

const ALLOWED = ['http://allowed.example', 'http://localhost:3000'];
let server: Server;
let baseUrl: string;

/**
 * Minimal Express app that only mounts the security middleware chain.
 * The CORS whitelist is injected explicitly so the test does not depend
 * on the environment.
 */
function createApp(): Express {
  const app = express();
  app.use(...security({ allowedOrigins: ALLOWED }));
  app.get('/ping', (_req, res) => {
    res.json({ ok: true });
  });
  return app;
}

beforeAll(async () => {
  server = await new Promise<Server>((resolve) => {
    const listener = createApp().listen(0, '127.0.0.1', () => resolve(listener));
  });
  const address = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${address.port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test('CORS allows an origin from the whitelist', async () => {
  const response = await fetch(`${baseUrl}/ping`, {
    headers: { Origin: 'http://allowed.example' },
  });
  expect(response.headers.get('access-control-allow-origin')).toBe('http://allowed.example');
  expect(response.headers.get('access-control-allow-credentials')).toBe('true');
});

test('CORS omits the allow-origin header for a non-whitelisted origin', async () => {
  const response = await fetch(`${baseUrl}/ping`, {
    headers: { Origin: 'http://evil.example' },
  });
  expect(response.headers.get('access-control-allow-origin')).toBeNull();
});

test('CORS allows requests without an Origin header (server-to-server)', async () => {
  const response = await fetch(`${baseUrl}/ping`);
  expect(response.status).toBe(200);
  // No allow-origin header is sent, but the request must still succeed.
  expect(response.headers.get('access-control-allow-origin')).toBeNull();
});

test('CORS reflects the request method and headers in a preflight response', async () => {
  const response = await fetch(`${baseUrl}/ping`, {
    method: 'OPTIONS',
    headers: {
      Origin: 'http://allowed.example',
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'content-type,authorization',
    },
  });
  expect(response.status).toBe(204);
  expect(response.headers.get('access-control-allow-origin')).toBe(
    'http://allowed.example',
  );
  expect(response.headers.get('access-control-allow-methods') ?? '').toMatch(/POST/);
});

test('helmet sets a strict Content-Security-Policy', async () => {
  const response = await fetch(`${baseUrl}/ping`);
  const csp = response.headers.get('content-security-policy');
  expect(csp).toBeTruthy();
  expect(csp!).toMatch(/default-src 'none'/);
  expect(csp!).toMatch(/frame-ancestors 'none'/);
  expect(csp!).toMatch(/base-uri 'none'/);
});

test('helmet hides the X-Powered-By header', async () => {
  const response = await fetch(`${baseUrl}/ping`);
  expect(response.headers.get('x-powered-by')).toBeNull();
});

test('helmet sets X-Content-Type-Options: nosniff', async () => {
  const response = await fetch(`${baseUrl}/ping`);
  expect(response.headers.get('x-content-type-options')).toBe('nosniff');
});

test('helmet sets Referrer-Policy: no-referrer', async () => {
  const response = await fetch(`${baseUrl}/ping`);
  expect(response.headers.get('referrer-policy')).toBe('no-referrer');
});

test('helmet sets Cross-Origin-Resource-Policy: same-site', async () => {
  const response = await fetch(`${baseUrl}/ping`);
  expect(response.headers.get('cross-origin-resource-policy')).toBe('same-site');
});