import { z } from 'zod';

export const ClearHistoryRequestSchema = z.object({
  confirmation: z.boolean(),
});
export type ClearHistoryRequest = z.infer<typeof ClearHistoryRequestSchema>;
