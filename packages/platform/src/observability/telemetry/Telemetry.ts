export interface Telemetry {
  tracer: import('../tracing/Tracer.js').Tracer;
  metrics: import('../metrics/MetricsCollector.js').MetricsCollector;
  shutdown(): Promise<void>;
}
