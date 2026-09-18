import { z } from 'zod';

export const IdRequestSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
});

export type IdRequest = z.infer<typeof IdRequestSchema>;
