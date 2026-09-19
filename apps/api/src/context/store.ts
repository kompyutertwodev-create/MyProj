import { AsyncLocalStorage } from 'node:async_hooks';
import { EMPTY_EVENT_CONTEXT, type EventContext } from '@workspace/kernel';
import type { RequestContext } from './RequestContext.js';

/**
 * Process-wide AsyncLocalStorage instance.
 *
 * Every HTTP request runs inside `storage.run(...)` so that application
 * code (handlers, repositories, outbox writers) can read the ambient
 * context without threading it through every function signature.
 *
 * Background jobs (queue workers, scheduled tasks, CLI commands) that do
 * not run inside an HTTP request will simply see `undefined` from
 * `getRequestContext()` and `EMPTY_EVENT_CONTEXT` from `getEventContext()`.
 */
const storage = new AsyncLocalStorage<RequestContext>();

/**
 * Run `fn` with the given RequestContext installed as the ambient context.
 *
 * Nested calls inherit the innermost context. This is the single entry
 * point used by the `request-context` middleware.
 */
export function runWithRequestContext<T>(
  context: RequestContext,
  fn: () => T,
): T {
  return storage.run(context, fn);
}

/**
 * Read the current RequestContext.
 *
 * Returns `undefined` when called outside of an HTTP request (e.g. from a
 * background job or a unit test).
 */
export function getRequestContext(): RequestContext | undefined {
  return storage.getStore();
}

/**
 * Read only the ambient EventContext.
 *
 * Falls back to EMPTY_EVENT_CONTEXT so callers never have to null-check
 * when building outbox envelopes or emitting domain events.
 */
export function getEventContext(): EventContext {
  return storage.getStore()?.eventContext ?? EMPTY_EVENT_CONTEXT;
}

/**
 * Shallow-merge the ambient EventContext with an explicit override.
 *
 * The override wins field-by-field. Useful inside handlers that need to
 * pin a specific actorId or tenantId for a particular event without
 * touching the ambient context.
 *
 * Kept separate from `mergeContext` in `@workspace/kernel` on purpose:
 *   - `mergeContext(base, override)` is a pure function.
 *   - `withEventContext(override)` reads the ambient context for you.
 */
export function withEventContext(
  override: Partial<EventContext>,
): EventContext {
  const base = getEventContext();
  return {
    correlationId: override.correlationId ?? base.correlationId,
    causationId: override.causationId ?? base.causationId,
    actorId: override.actorId ?? base.actorId,
    tenantId: override.tenantId !== undefined ? override.tenantId : base.tenantId,
    extras: { ...(base.extras ?? {}), ...(override.extras ?? {}) },
  };
}