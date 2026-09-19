import { randomUUID } from 'node:crypto';
import type { RequestHandler } from 'express';

/**
 * Header name used for the request id. Standardised by the OpenTelemetry
 * and W3C Trace Context specifications; commonly used by nginx, Envoy,
 * Cloudflare and AWS ALB.
 */
export const REQUEST_ID_HEADER = 'x-request-id';

/**
 * Maximum accepted length for an inbound request id. Anything longer is
 * treated as hostile input and replaced with a fresh uuid.
 */
const MAX_REQUEST_ID_LENGTH = 128;

/**
 * Characters allowed in an inbound request id.
 *
 * We accept:
 *   - ASCII letters and digits
 *   - dash and underscore
 *   - the dots used by W3C trace ids
 *
 * Everything else (spaces, quotes, control characters, unicode) is
 * rejected. This prevents header-injection attacks that would otherwise
 * poison our logs, traces and outbox metadata.
 */
const REQUEST_ID_PATTERN = /^[A-Za-z0-9._-]+$/;

/**
 * Normalise an inbound request id.
 *
 * Returns `undefined` when the value is missing, too long, or contains
 * unsafe characters, so the caller can fall back to a fresh uuid.
 */
function normaliseInbound(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > MAX_REQUEST_ID_LENGTH) {
    return undefined;
  }
  if (!REQUEST_ID_PATTERN.test(trimmed)) return undefined;
  return trimmed;
}

/**
 * Express middleware that guarantees a `req.id` on every request.
 *
 * Behaviour:
 *   1. If the client sent a safe `X-Request-ID`, reuse it.
 *   2. Otherwise, generate a fresh uuid v4.
 *   3. Set the value on `req.id` (used by pino-http).
 *   4. Echo the value back in the `X-Request-ID` response header.
 *
 * Safe to mount before pino-http: pino-http reads `req.id` lazily when it
 * emits its "request completed" log line, which is after this middleware
 * has already run.
 */
export function requestId(): RequestHandler {
  return (req, res, next) => {
    const inbound = normaliseInbound(req.headers[REQUEST_ID_HEADER]);
    const id = inbound ?? randomUUID();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (req as any).id = id;
    res.setHeader('X-Request-ID', id);

    next();
  };
}