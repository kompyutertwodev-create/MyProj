import { z } from 'zod';

export const GetCollectionsRequestSchema = z.object({
  type: z.enum(['trending', 'popular', 'new', 'featured']).optional(),
});
export type GetCollectionsRequest = z.infer<typeof GetCollectionsRequestSchema>;
