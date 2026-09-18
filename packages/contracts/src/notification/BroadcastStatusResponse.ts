import { z } from 'zod';

export const BroadcastStatusResponseSchema = z.object({
  status: z.string(),
  sent: z.number().int(),
  failed: z.number().int(),
});
export type BroadcastStatusResponse = z.infer<typeof BroadcastStatusResponseSchema>;
