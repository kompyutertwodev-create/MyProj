import { z } from 'zod';
import { CreateContentRequestSchema } from './CreateContentRequest';

export const BulkCreateContentRequestSchema = z.object({
  items: z.array(CreateContentRequestSchema),
});

export type BulkCreateContentRequest = z.infer<typeof BulkCreateContentRequestSchema>;
