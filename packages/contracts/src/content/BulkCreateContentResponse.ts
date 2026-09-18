import { z } from 'zod';

export const BulkCreateContentResponseSchema = z.object({
  created: z.array(z.unknown()),
  failed: z.array(z.unknown()),
});

export type BulkCreateContentResponse = z.infer<typeof BulkCreateContentResponseSchema>;
