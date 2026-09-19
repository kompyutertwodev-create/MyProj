import type { Response } from 'express';
import type { Result } from '@workspace/kernel';
import type { ApplicationError } from '../../../application/ports/ApplicationError.js';

/**
 * Send a Result to the client.
 *
 * Success responses use the shared envelope `{ success: true, data }`.
 * Application errors carry an HTTP status code and a machine-readable
 * code, so we surface them directly instead of routing through the
 * Express error handler вЂ” that keeps the controller self-contained and
 * avoids coupling apps/api to this module's error hierarchy.
 */
export function sendResult<T>(
  res: Response,
  result: Result<T, ApplicationError>,
  successStatus = 200,
): void {
  if (result.isErr()) {
    const error = result.error;
    res.status(error.statusCode).json({
      success: false,
      error: { code: error.code, message: error.message },
    });
    return;
  }
  res.status(successStatus).json({ success: true, data: result.value });
}