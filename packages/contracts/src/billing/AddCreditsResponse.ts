import { z } from 'zod';

export const AddCreditsResponseSchema = z.object({
  added: z.literal(true),
  newBalance: z.number(),
});
export type AddCreditsResponse = z.infer<typeof AddCreditsResponseSchema>;
