import { z } from 'zod';

export const GetProgressResponseSchema = z.object({
  progress: z.number(),
  duration: z.number(),
  completed: z.boolean(),
  lastWatchedAt: z.string().datetime(),
});
export type GetProgressResponse = z.infer<typeof GetProgressResponseSchema>;
