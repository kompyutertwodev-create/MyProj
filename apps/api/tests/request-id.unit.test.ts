import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import express, { type Express } from 'express';
import { requestId } from '../src/middleware/request-id.js';

let server: Server;
let baseUrl: string;

/**
 * Minimal Express app that only mounts the requestId middleware.
 *
 * The route echoes back whatever `req.id` was set to, so tests can assert
 * that a client-supplied id is preserved or replaced as expected.
 */
function createApp(): Express {
  const app = express();
  app.set('trust proxy', 1);
  app.use(requestId());
  app.get('/echo', (req, res) => {
    res.json({ id: (req as { id?: string }).id });
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

test('uses an inbound X-Request-ID when it is well-formed', async () => {
  const response = await fetch(`${baseUrl}/echo`, {
    headers: { 'X-Request-ID': 'trace-abc-123' },
  });
  const body = (await response.json()) as { id: string };
  assert.equal(body.id, 'trace-abc-123');
  assert.equal(response.headers.get('x-request-id'), 'trace-abc-123');
});

test('generates a fresh UUID when no X-Request-ID is provided', async () => {
  const response = await fetch(`${baseUrl}/echo`);
  const body = (await response.json()) as { id: string };
  assert.match(
    body.id,
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  );
  assert.equal(response.headers.get('x-request-id'), body.id);
});

test('rejects an over-long X-Request-ID and generates a fresh UUID', async () => {
  const long = 'a'.repeat(200);
  const response = await fetch(`${baseUrl}/echo`, {
    headers: { 'X-Request-ID': long },
  });
  const body = (await response.json()) as { id: string };
  assert.notEqual(body.id, long);
  assert.match(body.id, /^[0-9a-f-]{36}$/i);
});

test('rejects an X-Request-ID containing unsafe characters', async () => {
  const unsafe = 'evil;injection';
  const response = await fetch(`${baseUrl}/echo`, {
    headers: { 'X-Request-ID': unsafe },
  });
  const body = (await response.json()) as { id: string };
  assert.notEqual(body.id, unsafe);
  assert.match(body.id, /^[0-9a-f-]{36}$/i);
});

test('strips surrounding whitespace from an inbound X-Request-ID', async () => {
  const response = await fetch(`${baseUrl}/echo`, {
    headers: { 'X-Request-ID': '  trimmed-id  ' },
  });
  const body = (await response.json()) as { id: string };
  assert.equal(body.id, 'trimmed-id');
});