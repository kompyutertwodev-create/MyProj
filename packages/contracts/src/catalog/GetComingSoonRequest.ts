import { z } from 'zod';

export const GetComingSoonRequestSchema = z.object({
  limit: z.number().optional(),
});
export type GetComingSoonRequest = z.infer<typeof GetComingSoonRequestSchema>;
