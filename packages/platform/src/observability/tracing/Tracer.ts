import type { Span } from './Span.js';
export interface Tracer {
  startSpan(name: string, attributes?: Record<string, string | number | boolean>): Span;
  withSpan<T>(
    name: string,
    fn: (span: Span) => Promise<T>,
    attributes?: Record<string, string | number | boolean>
  ): Promise<T>;
}
