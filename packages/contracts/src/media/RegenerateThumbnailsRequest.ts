import { z } from 'zod';

export const RegenerateThumbnailsRequestSchema = z.object({
  count: z.number().int().optional(),
});
export type RegenerateThumbnailsRequest = z.infer<typeof RegenerateThumbnailsRequestSchema>;
