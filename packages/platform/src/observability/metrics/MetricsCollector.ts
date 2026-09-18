import type { Metric } from './Metric.js';
export interface MetricsCollector {
  increment(name: string, value?: number, labels?: Record<string, string>): void;
  gauge(name: string, value: number, labels?: Record<string, string>): void;
  observe(name: string, value: number, labels?: Record<string, string>): void;
  collect(): Metric[];
}
