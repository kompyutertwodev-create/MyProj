import { z } from 'zod';

export const ArchiveContentResponseSchema = z.object({
  archived: z.literal(true),
});

export type ArchiveContentResponse = z.infer<typeof ArchiveContentResponseSchema>;
