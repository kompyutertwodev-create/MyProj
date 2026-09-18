import { z } from 'zod';

export const BulkPublishContentResponseSchema = z.object({
  published: z.array(z.unknown()),
  failed: z.array(z.unknown()),
});

export type BulkPublishContentResponse = z.infer<typeof BulkPublishContentResponseSchema>;
