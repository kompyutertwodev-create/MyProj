import { z } from 'zod';

export const ProcessingStatusResponseSchema = z.object({
  status: z.string(),
  progress: z.number(),
});
export type ProcessingStatusResponse = z.infer<typeof ProcessingStatusResponseSchema>;
