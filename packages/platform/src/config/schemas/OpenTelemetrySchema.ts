import { z } from 'zod';

export const OpenTelemetrySchema = z.object({
  OTEL_SERVICE_NAME: z.string().min(1).default('service'),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().url().optional(),
});

export type OpenTelemetryConfig = z.infer<typeof OpenTelemetrySchema>;
