import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import express, { type Express } from 'express';
import { requestId } from '../src/middleware/request-id.js';
import { requestContext } from '../src/middleware/request-context.js';
import {
  getRequestContext,
  getEventContext,
  withEventContext,
} from '../src/context/index.js';
import { EMPTY_EVENT_CONTEXT } from '@workspace/kernel';

let server: Server;
let baseUrl: string;

/**
 * Minimal Express app that mounts requestId + requestContext and exposes
 * a route that reports what the ambient context looks like from inside
 * an async handler.
 */
function createApp(): Express {
  const app = express();
  app.set('trust proxy', 1);
  app.use(requestId());
  app.use(requestContext());

  app.get('/context', async (_req, res) => {
    // Simulate an async hop — the context must survive it.
    await Promise.resolve();
    const ctx = getRequestContext();
    const evt = getEventContext();
    res.json({
      requestId: ctx?.requestId,
      correlationId: evt.correlationId,
      actorId: evt.actorId ?? null,
      tenantId: evt.tenantId ?? null,
    });
  });

  app.get('/merge', (_req, res) => {
    const merged = withEventContext({ actorId: 'user-42', tenantId: 'tenant-7' });
    res.json({
      correlationId: merged.correlationId,
      actorId: merged.actorId,
      tenantId: merged.tenantId,
    });
  });

  app.get('/nested-async', async (_req, res) => {
    const first = getEventContext().correlationId;
    await new Promise((resolve) => setTimeout(resolve, 5));
    const second = getEventContext().correlationId;
    await Promise.all([
      (async () => {
        await new Promise((resolve) => setTimeout(resolve, 5));
        return getEventContext().correlationId;
      })(),
      (async () => {
        await Promise.resolve();
        return getEventContext().correlationId;
      })(),
    ]);
    const third = getEventContext().correlationId;
    res.json({ first, second, third });
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

test('getEventContext() returns EMPTY_EVENT_CONTEXT outside a request', () => {
  const ctx = getRequestContext();
  const evt = getEventContext();
  assert.equal(ctx, undefined);
  assert.deepEqual(evt, EMPTY_EVENT_CONTEXT);
});

test('getRequestContext() is populated inside a request', async () => {
  const response = await fetch(`${baseUrl}/context`, {
    headers: { 'X-Request-ID': 'trace-ctx-1' },
  });
  const body = (await response.json()) as {
    requestId: string;
    correlationId: string;
    actorId: string | null;
    tenantId: string | null;
  };
  assert.equal(body.requestId, 'trace-ctx-1');
  assert.equal(body.correlationId, 'trace-ctx-1');
  assert.equal(body.actorId, null);
  assert.equal(body.tenantId, null);
});

test('correlationId defaults to the generated request id', async () => {
  const response = await fetch(`${baseUrl}/context`);
  const body = (await response.json()) as {
    requestId: string;
    correlationId: string;
  };
  assert.match(body.requestId, /^[0-9a-f-]{36}$/i);
  assert.equal(body.correlationId, body.requestId);
});

test('withEventContext() merges the override over the ambient context', async () => {
  const response = await fetch(`${baseUrl}/merge`, {
    headers: { 'X-Request-ID': 'trace-merge-1' },
  });
  const body = (await response.json()) as {
    correlationId: string;
    actorId: string;
    tenantId: string;
  };
  assert.equal(body.correlationId, 'trace-merge-1');
  assert.equal(body.actorId, 'user-42');
  assert.equal(body.tenantId, 'tenant-7');
});

test('context survives nested async hops', async () => {
  const response = await fetch(`${baseUrl}/nested-async`, {
    headers: { 'X-Request-ID': 'trace-async-1' },
  });
  const body = (await response.json()) as {
    first: string;
    second: string;
    third: string;
  };
  assert.equal(body.first, 'trace-async-1');
  assert.equal(body.second, 'trace-async-1');
  assert.equal(body.third, 'trace-async-1');
});