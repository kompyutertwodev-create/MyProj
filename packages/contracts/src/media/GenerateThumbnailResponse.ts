import { z } from 'zod';

export const GenerateThumbnailResponseSchema = z.object({
  generated: z.literal(true),
  url: z.string(),
});
export type GenerateThumbnailResponse = z.infer<typeof GenerateThumbnailResponseSchema>;
