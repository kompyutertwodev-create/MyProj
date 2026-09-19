import cors, { type CorsOptions } from 'cors';
import helmet, { type HelmetOptions } from 'helmet';
import type { RequestHandler } from 'express';

/**
 * Read the CORS whitelist from the environment.
 *
 * Supports both the legacy singular `CORS_ORIGIN` and the newer
 * comma-separated `CORS_ORIGINS`. Values are trimmed; empty entries are
 * dropped. When neither is set, we fall back to localhost in development
 * and deny everything else in production.
 */
function loadAllowedOrigins(): string[] {
  const raw = process.env['CORS_ORIGINS'] ?? process.env['CORS_ORIGIN'] ?? '';
  const parsed = raw
    .split(',')
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

  if (parsed.length > 0) return parsed;

  if (process.env['NODE_ENV'] === 'production') {
    // Safer default than "*": refuse cross-origin requests unless the
    // operator explicitly whitelists them.
    return [];
  }

  // Development default: the web and admin dev servers.
  return ['http://localhost:3000', 'http://localhost:3001'];
}

/**
 * Origin callback used by the CORS middleware.
 *
 * Requests with no Origin header (server-to-server, curl, native apps)
 * are always allowed — CORS is a browser-only protection. Browser
 * requests are allowed only when their Origin is in the whitelist.
 */
function buildOriginValidator(allowed: readonly string[]): CorsOptions['origin'] {
  if (allowed.length === 0) {
    // Nothing whitelisted: still allow no-Origin requests so that
    // server-to-server traffic keeps working.
    return (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }
      callback(null, false);
    };
  }

  const allowedSet = new Set(allowed);
  return (origin, callback) => {
    if (!origin) {
      callback(null, true);
      return;
    }
    callback(null, allowedSet.has(origin));
  };
}

/**
 * Helmet configuration tuned for a JSON API.
 *
 * Highlights:
 *   - Content-Security-Policy: deny everything by default. The API never
 *     serves HTML, so even `'self'` is unnecessary. If a future endpoint
 *     needs to serve HTML, tighten this per route.
 *   - Strict-Transport-Security: 180 days, include subdomains.
 *   - crossOriginResourcePolicy: same-site, which is stricter than the
 *     Helmet default of same-origin and works for our SPA consumers.
 *   - referrerPolicy: no-referrer — we do not need referrer data.
 */
function buildHelmetOptions(): HelmetOptions {
  const isProduction = process.env['NODE_ENV'] === 'production';

  return {
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        defaultSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'none'"],
        formAction: ["'none'"],
      },
    },
    strictTransportSecurity: isProduction
      ? {
          maxAge: 60 * 60 * 24 * 180, // 180 days
          includeSubDomains: true,
          preload: false,
        }
      : false,
    crossOriginResourcePolicy: { policy: 'same-site' },
    crossOriginOpenerPolicy: { policy: 'same-origin' },
    referrerPolicy: { policy: 'no-referrer' },
    // The API has no HTML UI, so hide the framework banner entirely.
    hidePoweredBy: true,
  };
}

export interface SecurityOptions {
  /** Override the CORS whitelist. Primarily used in tests. */
  readonly allowedOrigins?: readonly string[];
}

/**
 * Build the security middleware chain: helmet first, then CORS.
 *
 * Order matters only relative to other middleware, not between the two:
 *   - helmet sets response headers on the way out.
 *   - cors short-circuits preflight OPTIONS requests on the way in.
 */
export function security(options: SecurityOptions = {}): RequestHandler[] {
  const allowed = options.allowedOrigins ?? loadAllowedOrigins();

  const helmetMiddleware = helmet(buildHelmetOptions());
  const corsMiddleware = cors({
    origin: buildOriginValidator(allowed),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    exposedHeaders: ['X-Request-ID'],
    maxAge: 600, // Cache preflight for 10 minutes.
  });

  return [helmetMiddleware, corsMiddleware];
}

/**
 * Exposed for diagnostics and tests.
 */
export function getAllowedOrigins(): readonly string[] {
  return loadAllowedOrigins();
}