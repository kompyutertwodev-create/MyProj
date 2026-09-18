import { z } from 'zod';

export const UseCreditsRequestSchema = z.object({
  amount: z.number(),
  description: z.string(),
});
export type UseCreditsRequest = z.infer<typeof UseCreditsRequestSchema>;
