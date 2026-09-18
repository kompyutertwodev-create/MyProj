import type { SpanContext } from './SpanContext.js';
export interface Span {
  readonly context: SpanContext;
  setAttribute(key: string, value: string | number | boolean): this;
  addEvent(name: string, attributes?: Record<string, unknown>): this;
  end(): void;
}
