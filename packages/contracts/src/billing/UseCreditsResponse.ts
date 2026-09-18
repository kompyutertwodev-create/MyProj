import { z } from 'zod';

export const UseCreditsResponseSchema = z.object({
  used: z.literal(true),
  newBalance: z.number(),
});
export type UseCreditsResponse = z.infer<typeof UseCreditsResponseSchema>;
