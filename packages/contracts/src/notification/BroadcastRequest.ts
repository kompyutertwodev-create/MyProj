import { z } from 'zod';

export const BroadcastRequestSchema = z.object({
  type: z.enum(['email', 'push', 'sms']),
  title: z.string().min(1),
  body: z.string().min(1),
  filters: z.record(z.unknown()).optional(),
});
export type BroadcastRequest = z.infer<typeof BroadcastRequestSchema>;
