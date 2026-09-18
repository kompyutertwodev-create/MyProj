import { z } from 'zod';

export const LikeContentRequestSchema = z.object({
  contentId: z.string(),
});
export type LikeContentRequest = z.infer<typeof LikeContentRequestSchema>;
