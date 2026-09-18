import { z } from 'zod';

export const ProcessMediaResponseSchema = z.object({
  jobId: z.string(),
});
export type ProcessMediaResponse = z.infer<typeof ProcessMediaResponseSchema>;
