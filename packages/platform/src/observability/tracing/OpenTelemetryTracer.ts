import { trace, type Span as OtelSpan } from '@opentelemetry/api';
import type { Tracer } from './Tracer.js';
import type { Span } from './Span.js';
import type { SpanContext } from './SpanContext.js';
class SpanAdapter implements Span {
  constructor(
    private readonly span: OtelSpan,
    readonly context: SpanContext
  ) {}
  setAttribute(k: string, v: string | number | boolean): this {
    this.span.setAttribute(k, v);
    return this;
  }
  addEvent(n: string, a?: Record<string, unknown>): this {
    this.span.addEvent(n, a as Parameters<OtelSpan['addEvent']>[1]);
    return this;
  }
  end(): void {
    this.span.end();
  }
}
export class OpenTelemetryTracer implements Tracer {
  private readonly tracer = trace.getTracer('workspace-platform');
  startSpan(name: string, attributes?: Record<string, string | number | boolean>): Span {
    const span = this.tracer.startSpan(name, { attributes });
    const c = span.spanContext();
    return new SpanAdapter(span, {
      traceId: c.traceId,
      spanId: c.spanId,
      traceFlags: c.traceFlags,
      traceState: c.traceState?.serialize(),
    });
  }
  async withSpan<T>(
    name: string,
    fn: (span: Span) => Promise<T>,
    attributes?: Record<string, string | number | boolean>
  ): Promise<T> {
    const span = this.startSpan(name, attributes);
    try {
      return await fn(span);
    } finally {
      span.end();
    }
  }
}
