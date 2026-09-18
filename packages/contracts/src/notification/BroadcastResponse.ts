import { z } from 'zod';

export const BroadcastResponseSchema = z.object({
  broadcastId: z.string(),
  recipientCount: z.number().int(),
});
export type BroadcastResponse = z.infer<typeof BroadcastResponseSchema>;
