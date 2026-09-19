import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
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

before(async () => {
  server = await new Promise<Server>((resolve) => {
    const listener = createApp().listen(0, '127.0.0.1', () => resolve(listener));
  });
  const address = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test('CORS allows an origin from the whitelist', async () => {
  const response = await fetch(`${baseUrl}/ping`, {
    headers: { Origin: 'http://allowed.example' },
  });
  assert.equal(response.headers.get('access-control-allow-origin'), 'http://allowed.example');
  assert.equal(response.headers.get('access-control-allow-credentials'), 'true');
});

test('CORS omits the allow-origin header for a non-whitelisted origin', async () => {
  const response = await fetch(`${baseUrl}/ping`, {
    headers: { Origin: 'http://evil.example' },
  });
  assert.equal(response.headers.get('access-control-allow-origin'), null);
});

test('CORS allows requests without an Origin header (server-to-server)', async () => {
  const response = await fetch(`${baseUrl}/ping`);
  assert.equal(response.status, 200);
  // No allow-origin header is sent, but the request must still succeed.
  assert.equal(response.headers.get('access-control-allow-origin'), null);
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
  assert.equal(response.status, 204);
  assert.equal(
    response.headers.get('access-control-allow-origin'),
    'http://allowed.example',
  );
  assert.match(
    response.headers.get('access-control-allow-methods') ?? '',
    /POST/,
  );
});

test('helmet sets a strict Content-Security-Policy', async () => {
  const response = await fetch(`${baseUrl}/ping`);
  const csp = response.headers.get('content-security-policy');
  assert.ok(csp, 'CSP header must be set');
  assert.match(csp, /default-src 'none'/);
  assert.match(csp, /frame-ancestors 'none'/);
  assert.match(csp, /base-uri 'none'/);
});

test('helmet hides the X-Powered-By header', async () => {
  const response = await fetch(`${baseUrl}/ping`);
  assert.equal(response.headers.get('x-powered-by'), null);
});

test('helmet sets X-Content-Type-Options: nosniff', async () => {
  const response = await fetch(`${baseUrl}/ping`);
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
});

test('helmet sets Referrer-Policy: no-referrer', async () => {
  const response = await fetch(`${baseUrl}/ping`);
  assert.equal(response.headers.get('referrer-policy'), 'no-referrer');
});

test('helmet sets Cross-Origin-Resource-Policy: same-site', async () => {
  const response = await fetch(`${baseUrl}/ping`);
  assert.equal(response.headers.get('cross-origin-resource-policy'), 'same-site');
});