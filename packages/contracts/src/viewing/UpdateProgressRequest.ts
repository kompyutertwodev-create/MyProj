import { z } from 'zod';

export const UpdateProgressRequestSchema = z.object({
  contentId: z.string(),
  progress: z.number(),
  duration: z.number(),
  completed: z.boolean().optional(),
});
export type UpdateProgressRequest = z.infer<typeof UpdateProgressRequestSchema>;
