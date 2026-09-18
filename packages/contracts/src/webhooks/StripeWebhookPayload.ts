import { z } from 'zod';

export const StripeWebhookPayloadSchema = z.object({
  id: z.string(),
  object: z.literal('event'),
  type: z.string(),
  apiVersion: z.string().optional(),
  created: z.number().int(),
  data: z.object({
    object: z.record(z.string(), z.unknown()),
  }),
  livemode: z.boolean(),
  pendingWebhooks: z.number().int().optional(),
});
export type StripeWebhookPayload = z.infer<typeof StripeWebhookPayloadSchema>;
