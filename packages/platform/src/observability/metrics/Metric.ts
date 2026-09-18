import type { MetricType } from './MetricType.js';
export interface Metric {
  name: string;
  type: MetricType;
  value: number;
  labels?: Record<string, string>;
  timestamp?: number;
}
