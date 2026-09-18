import { z } from 'zod';

export const UpdateProgressResponseSchema = z.object({
  contentId: z.string(),
  progress: z.number(),
  updatedAt: z.string().datetime(),
});
export type UpdateProgressResponse = z.infer<typeof UpdateProgressResponseSchema>;
