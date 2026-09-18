import { z } from 'zod';

export const SendBatchResponseSchema = z.object({
  sent: z.number().int(),
  failed: z.array(z.unknown()),
});
export type SendBatchResponse = z.infer<typeof SendBatchResponseSchema>;
