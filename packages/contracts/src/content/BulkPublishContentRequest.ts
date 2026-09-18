import { z } from 'zod';

export const BulkPublishContentRequestSchema = z.object({
  ids: z.array(z.string()),
});

export type BulkPublishContentRequest = z.infer<typeof BulkPublishContentRequestSchema>;
