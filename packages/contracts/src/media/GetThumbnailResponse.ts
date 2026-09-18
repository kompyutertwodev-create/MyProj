import { z } from 'zod';

export const GetThumbnailResponseSchema = z.object({
  url: z.string(),
});
export type GetThumbnailResponse = z.infer<typeof GetThumbnailResponseSchema>;
