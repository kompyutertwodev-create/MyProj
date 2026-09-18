export interface SpanContext {
  traceId: string;
  spanId: string;
  traceFlags?: number;
  traceState?: string;
}
