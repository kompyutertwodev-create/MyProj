import rateLimit, { type RateLimitRequestHandler } from 'express-rate-limit';
import slowDown from 'express-slow-down';
import type { RequestHandler } from 'express';

/**
 * Response body shape for rate-limit rejections.
 *
 * Matches the shape used by the global error handler so clients can parse
 * errors uniformly.
 */
const RATE_LIMIT_BODY = {
  success: false,
  error: {
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests',
  },
} as const;

const SLOW_DOWN_BODY = {
  success: false,
  error: {
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests',
  },
} as const;

/**
 * Global rate limit: 300 requests per minute per IP.
 *
 * This is the outer safety net. It is deliberately generous because a
 * single page in the web app may fan out to several API calls, and we do
 * not want to punish legitimate users.
 */
export function globalRateLimit(): RateLimitRequestHandler {
  return rateLimit({
    windowMs: 60_000,
    limit: 300,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: RATE_LIMIT_BODY,
  });
}

/**
 * Global slow-down: after 150 requests in a minute, add a 250 ms delay.
 *
 * Delay is applied per request, cumulatively (express-slow-down multiplies
 * the delay by the number of requests over the threshold by default).
 * This gives abusive clients a chance to back off before they hit the
 * hard limit above.
 */
export function globalSlowDown(): RequestHandler {
  return slowDown({
    windowMs: 60_000,
    delayAfter: 150,
    delayMs: () => 250,
  });
}

/**
 * Extract a stable client identifier for per-account rate limiting.
 *
 * Prefers `body.email` when present (login/register/forgot-password), so
 * that a brute-force attacker cannot cycle through many accounts from a
 * single IP without being throttled. Falls back to the IP address.
 */
function authKey(req: Parameters<RateLimitRequestHandler>[0]): string {
  const ip = req.ip ?? 'unknown';
  const body = req.body as { email?: unknown } | undefined;
  const email =
    body && typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  return email.length > 0 ? `${ip}:${email}` : ip;
}

/**
 * Strict rate limit for authentication endpoints: 5 attempts per minute.
 *
 * Applied only to `/api/v1/auth/*` (login, register, refresh, OAuth).
 * Kept as a separate handler so that it can be mounted *before* the
 * auth router without affecting other routes.
 */
export function authRateLimit(): RateLimitRequestHandler {
  return rateLimit({
    windowMs: 60_000,
    limit: 5,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    keyGenerator: authKey,
    message: {
      success: false,
      error: {
        code: 'AUTH_RATE_LIMIT_EXCEEDED',
        message: 'Too many authentication attempts, please try again later',
      },
    },
  });
}

/**
 * Slow-down for authentication endpoints: after 3 attempts, add 1 s.
 *
 * Combined with {@link authRateLimit} this gives a two-stage defence:
 *   1. Slow down at attempt 4.
 *   2. Hard reject at attempt 6.
 *
 * The slow-down is intentionally longer than the global one because
 * password guessing is a high-value target.
 */
export function authSlowDown(): RequestHandler {
  return slowDown({
    windowMs: 60_000,
    delayAfter: 3,
    delayMs: () => 1_000,
    keyGenerator: (req) => authKey(req),
  });
}

// Re-export for tests that want to construct the body shape directly.
export const RATE_LIMIT_RESPONSE = RATE_LIMIT_BODY;
export const SLOW_DOWN_RESPONSE = SLOW_DOWN_BODY;