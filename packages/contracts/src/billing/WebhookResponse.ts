import { z } from 'zod';

export const WebhookResponseSchema = z.object({
  received: z.literal(true),
});
export type WebhookResponse = z.infer<typeof WebhookResponseSchema>;
