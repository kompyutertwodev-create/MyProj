import { MetricType } from './MetricType.js';
import type { Metric } from './Metric.js';
import type { MetricsCollector } from './MetricsCollector.js';
export class PrometheusCollector implements MetricsCollector {
  private readonly values = new Map<string, Metric>();
  private key(n: string, l?: Record<string, string>): string {
    return n + JSON.stringify(l ?? {});
  }
  increment(name: string, value = 1, labels?: Record<string, string>): void {
    const k = this.key(name, labels),
      old = this.values.get(k);
    this.values.set(k, {
      name,
      type: MetricType.Counter,
      value: (old?.value ?? 0) + value,
      labels,
    });
  }
  gauge(name: string, value: number, labels?: Record<string, string>): void {
    this.values.set(this.key(name, labels), { name, type: MetricType.Gauge, value, labels });
  }
  observe(name: string, value: number, labels?: Record<string, string>): void {
    this.values.set(this.key(name, labels), { name, type: MetricType.Histogram, value, labels });
  }
  collect(): Metric[] {
    return [...this.values.values()].map((m) => ({ ...m, labels: m.labels && { ...m.labels } }));
  }
  toPrometheus(): string {
    return (
      this.collect()
        .map(
          (m) =>
            `${m.name}${
              m.labels
                ? `{${Object.entries(m.labels)
                    .map(([k, v]) => `${k}="${v.replaceAll('"', '\\"')}"`)
                    .join(',')}}`
                : ''
            } ${m.value}`
        )
        .join('\n') + '\n'
    );
  }
}
