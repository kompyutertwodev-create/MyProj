import { z } from 'zod';

export const AddCreditsRequestSchema = z.object({
  amount: z.number(),
});
export type AddCreditsRequest = z.infer<typeof AddCreditsRequestSchema>;
