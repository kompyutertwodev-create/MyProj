import { z } from 'zod';

export const PolicyIdRequestSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid policy ID format'),
  }),
});

export type PolicyIdRequest = z.infer<typeof PolicyIdRequestSchema>;
