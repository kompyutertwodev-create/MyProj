import { mergeContext, type EventContext } from '../domain/EventContext.js';

/**
 * A function that returns the ambient EventContext. In an HTTP request this
 * is backed by AsyncLocalStorage; in tests it can be a constant.
 */
export type AmbientContextProvider = () => EventContext;

/**
 * Minimal structural shape of a write-side outbox that accepts an optional
 * EventContext. Both `OutboxStore.enqueue` and `OutboxEventBus.publish` fit
 * this shape, so a single wrapper serves the IAM and Access Control modules
 * without importing their concrete classes.
 */
export interface ContextAwareTarget {
  readonly enqueue?: (
    event: unknown,
    context?: EventContext,
  ) => Promise<void>;
  readonly enqueueAll?: (
    events: ReadonlyArray<unknown>,
    context?: EventContext,
  ) => Promise<void>;
  readonly publish?: (
    event: unknown,
    context?: EventContext,
  ) => Promise<void>;
  readonly publishAll?: (
    events: ReadonlyArray<unknown>,
    context?: EventContext,
  ) => Promise<void>;
}

/**
 * Wrap a write-side outbox so that every event automatically inherits the
 * ambient EventContext (correlationId, actorId, tenantId). A context passed
 * by the caller still wins field-by-field, so a handler can override
 * actorId or tenantId for a specific event.
 *
 * Uses a Proxy so that *every* method of the target (including subscribe,
 * claimBatch, markPublished, ...) is preserved. Only enqueue/enqueueAll/
 * publish/publishAll are rewritten to merge in the ambient context.
 *
 * The wrapper is a pure function of the target and the context provider: it
 * does not touch AsyncLocalStorage itself, which keeps @workspace/kernel
 * free of Node-only APIs and trivially testable.
 */
export function withAmbientContext<T extends ContextAwareTarget>(
  target: T,
  getContext: AmbientContextProvider,
): T {
  const wrap = (ctx?: EventContext): EventContext =>
    mergeContext(getContext(), ctx ?? {});

  return new Proxy(target, {
    get(t, prop, receiver) {
      const value = Reflect.get(t, prop, receiver);

      if (typeof value !== 'function') return value;

      if (prop === 'enqueue') {
        return (event: unknown, ctx?: EventContext) =>
          (value as (e: unknown, c?: EventContext) => Promise<void>).call(
            t,
            event,
            wrap(ctx),
          );
      }

      if (prop === 'enqueueAll') {
        return (events: ReadonlyArray<unknown>, ctx?: EventContext) =>
          (value as (
            e: ReadonlyArray<unknown>,
            c?: EventContext,
          ) => Promise<void>).call(t, events, wrap(ctx));
      }

      if (prop === 'publish') {
        return (event: unknown, ctx?: EventContext) =>
          (value as (e: unknown, c?: EventContext) => Promise<void>).call(
            t,
            event,
            wrap(ctx),
          );
      }

      if (prop === 'publishAll') {
        return (events: ReadonlyArray<unknown>, ctx?: EventContext) =>
          (value as (
            e: ReadonlyArray<unknown>,
            c?: EventContext,
          ) => Promise<void>).call(t, events, wrap(ctx));
      }

      // All other methods (subscribe, claimBatch, markPublished, ...) are
      // returned unchanged, preserving the original `this` binding.
      return (value as (...args: unknown[]) => unknown).bind(t);
    },
  });
}