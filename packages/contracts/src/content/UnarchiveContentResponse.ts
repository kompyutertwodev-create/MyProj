import { z } from 'zod';

export const UnarchiveContentResponseSchema = z.object({
  unarchived: z.literal(true),
});

export type UnarchiveContentResponse = z.infer<typeof UnarchiveContentResponseSchema>;
