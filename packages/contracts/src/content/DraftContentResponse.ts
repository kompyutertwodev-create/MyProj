import { z } from 'zod';

export const DraftContentResponseSchema = z.object({
  draft: z.literal(true),
});

export type DraftContentResponse = z.infer<typeof DraftContentResponseSchema>;
