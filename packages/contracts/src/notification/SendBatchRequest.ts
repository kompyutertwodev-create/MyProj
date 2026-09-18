import { z } from 'zod';

export const SendBatchRequestSchema = z.object({
  userIds: z.array(z.string()),
  type: z.enum(['email', 'push', 'sms']),
  title: z.string().min(1),
  body: z.string().min(1),
  data: z.record(z.unknown()).optional(),
});
export type SendBatchRequest = z.infer<typeof SendBatchRequestSchema>;
