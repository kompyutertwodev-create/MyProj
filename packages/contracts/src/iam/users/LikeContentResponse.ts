import { z } from 'zod';

export const LikeContentResponseSchema = z.object({
  liked: z.boolean(),
});
export type LikeContentResponse = z.infer<typeof LikeContentResponseSchema>;
