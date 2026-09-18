import { z } from 'zod';

export const WebhookRequestSchema = z.record(z.unknown());
export type WebhookRequest = z.infer<typeof WebhookRequestSchema>;
