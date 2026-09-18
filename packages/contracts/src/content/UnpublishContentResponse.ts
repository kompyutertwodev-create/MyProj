import { z } from 'zod';

export const UnpublishContentResponseSchema = z.object({
  unpublished: z.literal(true),
});

export type UnpublishContentResponse = z.infer<typeof UnpublishContentResponseSchema>;
