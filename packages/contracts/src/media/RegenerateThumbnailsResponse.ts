import { z } from 'zod';

export const RegenerateThumbnailsResponseSchema = z.object({
  jobId: z.string(),
});
export type RegenerateThumbnailsResponse = z.infer<typeof RegenerateThumbnailsResponseSchema>;
