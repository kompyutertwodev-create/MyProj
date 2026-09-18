import { z } from 'zod';

export const TranscodeDtoSchema = z.object({
  id: z.string(),
  format: z.string(),
  quality: z.string(),
  size: z.number(),
  url: z.string(),
});
export type TranscodeDto = z.infer<typeof TranscodeDtoSchema>;
