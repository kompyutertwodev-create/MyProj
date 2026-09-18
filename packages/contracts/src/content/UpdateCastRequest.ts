import { z } from 'zod';

export const UpdateCastRequestSchema = z.object({
  characterName: z.string(),
});

export type UpdateCastRequest = z.infer<typeof UpdateCastRequestSchema>;
