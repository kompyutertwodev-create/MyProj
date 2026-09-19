import type { EventContext } from '@workspace/kernel';

/**
 * Request-scoped context carried through the async call stack via
 * AsyncLocalStorage. It wraps an {@link EventContext} so that any event
 * raised while handling the request automatically inherits the ambient
 * correlation id, actor id and tenant id.
 *
 * It is intentionally separate from EventContext:
 *   - RequestContext is HTTP-specific (requestId comes from a header).
 *   - EventContext is a pure DDD type that also applies to non-HTTP entry
 *     points (CLI commands, queue workers, scheduled jobs).
 */
export interface RequestContext {
  /**
   * Correlation id for the current HTTP request.
   * Comes from the `X-Request-ID` header, or a fresh uuid when absent.
   */
  readonly requestId: string;

  /**
   * Ambient event metadata context inherited by every event raised
   * during this request.
   */
  readonly eventContext: EventContext;
}

/**
 * Convenience helper: produce a RequestContext whose correlationId is
 * derived from the requestId when not explicitly overridden.
 *
 * Any field in `overrides` wins over the default. Undefined fields are
 * omitted entirely so that `mergeContext` / `metadataFromContext` can
 * fall back to their own defaults downstream.
 */
export function createRequestContext(
  requestId: string,
  overrides: Partial<EventContext> = {},
): RequestContext {
  const eventContext: EventContext = {
    correlationId: overrides.correlationId ?? requestId,
    ...(overrides.causationId !== undefined ? { causationId: overrides.causationId } : {}),
    ...(overrides.actorId !== undefined ? { actorId: overrides.actorId } : {}),
    ...(overrides.tenantId !== undefined ? { tenantId: overrides.tenantId } : {}),
    ...(overrides.extras !== undefined ? { extras: overrides.extras } : {}),
  };

  return { requestId, eventContext };
}