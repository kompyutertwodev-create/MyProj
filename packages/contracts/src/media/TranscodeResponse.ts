import { z } from 'zod';

export const TranscodeResponseSchema = z.object({
  jobId: z.string(),
});
export type TranscodeResponse = z.infer<typeof TranscodeResponseSchema>;
