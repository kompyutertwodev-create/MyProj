import { z } from 'zod';

export const ComparePlansRequestSchema = z.object({
  ids: z.array(z.string()),
});
export type ComparePlansRequest = z.infer<typeof ComparePlansRequestSchema>;
