import { z } from 'zod';

export const DeleteSubtitlesResponseSchema = z.object({
  deleted: z.literal(true),
});
export type DeleteSubtitlesResponse = z.infer<typeof DeleteSubtitlesResponseSchema>;
