import { z } from 'zod';

export const BulkAddTagsRequestSchema = z.object({
  tags: z.array(z.string()),
});

export type BulkAddTagsRequest = z.infer<typeof BulkAddTagsRequestSchema>;
