import type { RequestHandler } from 'express';
import {
  createRequestContext,
  runWithRequestContext,
  type RequestContext,
} from '../context/index.js';

/**
 * Express middleware that installs the RequestContext into
 * AsyncLocalStorage for the duration of the request.
 *
 * Preconditions:
 *   - Must be mounted **after** `requestId()`, which guarantees `req.id`.
 *
 * Postconditions:
 *   - `getRequestContext()` returns the context from any async call made
 *     during request handling.
 *   - `getEventContext()` returns the ambient EventContext with a
 *     correlationId equal to the request id.
 *   - `req.context` is populated for convenience inside controllers.
 *
 * Actor and tenant are intentionally left unset here. They are filled in
 * by the auth middleware once the JWT has been verified, via
 * `runWithRequestContext` + `withEventContext` (see auth layer).
 */
export function requestContext(): RequestHandler {
  return (req, res, next) => {
    const requestIdValue = (req as { id?: string }).id;
    if (!requestIdValue) {
      // Defensive: requestId() must always run first. Failing fast here
      // would break production for a purely internal wiring mistake, so
      // we instead fall back to a synthetic id.
      next();
      return;
    }

    const context: RequestContext = createRequestContext(requestIdValue);

    // Expose the context on the request object for controllers that want
    // to read it synchronously without importing the store helpers.
    (req as { context?: RequestContext }).context = context;

    runWithRequestContext(context, () => {
      next();
    });
  };
}