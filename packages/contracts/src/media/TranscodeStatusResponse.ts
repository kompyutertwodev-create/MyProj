import { z } from 'zod';

export const TranscodeStatusResponseSchema = z.object({
  status: z.string(),
  progress: z.number(),
  url: z.string(),
});
export type TranscodeStatusResponse = z.infer<typeof TranscodeStatusResponseSchema>;
