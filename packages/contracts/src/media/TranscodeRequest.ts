import { z } from 'zod';

export const TranscodeRequestSchema = z.object({
  targetFormat: z.string(),
  quality: z.string(),
});
export type TranscodeRequest = z.infer<typeof TranscodeRequestSchema>;
