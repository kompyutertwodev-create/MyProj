import type { ErrorRequestHandler } from 'express';
import type { Logger } from '@workspace/platform';

export function createErrorHandler(logger: Logger): ErrorRequestHandler {
  return (err, _req, res, _next) => {
    logger.error('Unhandled request error', { err });

    if (res.headersSent) {
      return;
    }

    res.status(500).json({
      error: { message: 'Internal server error' },
    });
  };
}
