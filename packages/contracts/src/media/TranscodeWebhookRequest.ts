import { z } from 'zod';

export const TranscodeWebhookRequestSchema = z.record(z.unknown());
export type TranscodeWebhookRequest = z.infer<typeof TranscodeWebhookRequestSchema>;
