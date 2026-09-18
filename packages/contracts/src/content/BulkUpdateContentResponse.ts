import { z } from 'zod';

export const BulkUpdateContentResponseSchema = z.object({
  updated: z.array(z.unknown()),
  failed: z.array(z.unknown()),
});

export type BulkUpdateContentResponse = z.infer<typeof BulkUpdateContentResponseSchema>;
