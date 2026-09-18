export interface LogContext {
  requestId?: string;
  userId?: string;
  traceId?: string;
  module?: string;
  [key: string]: unknown;
}
