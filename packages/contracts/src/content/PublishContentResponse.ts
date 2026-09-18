import { z } from 'zod';

export const PublishContentResponseSchema = z.object({
  published: z.literal(true),
  publishedAt: z.string().datetime(),
});

export type PublishContentResponse = z.infer<typeof PublishContentResponseSchema>;
