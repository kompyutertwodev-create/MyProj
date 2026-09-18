import { z } from 'zod';

export const GenerateThumbnailRequestSchema = z.object({
  timestamp: z.number().optional(),
});
export type GenerateThumbnailRequest = z.infer<typeof GenerateThumbnailRequestSchema>;
