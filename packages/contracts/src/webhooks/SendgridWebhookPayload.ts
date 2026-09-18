import { z } from 'zod';

export const SendgridWebhookPayloadSchema = z.object({
  email: z.string().email().optional(),
  timestamp: z.number().optional(),
  event: z.string(),
  sgEventId: z.string().optional(),
  sgMessageId: z.string().optional(),
  category: z.union([z.string(), z.array(z.string())]).optional(),
  reason: z.string().optional(),
  status: z.string().optional(),
  url: z.string().optional(),
});
export type SendgridWebhookPayload = z.infer<typeof SendgridWebhookPayloadSchema>;
