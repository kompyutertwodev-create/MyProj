import { z } from 'zod';

export const BulkAddTagsResponseSchema = z.object({
  added: z.array(z.string()),
});

export type BulkAddTagsResponse = z.infer<typeof BulkAddTagsResponseSchema>;
