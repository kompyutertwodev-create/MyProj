import { z } from 'zod';

export const ComparePlansResponseSchema = z.object({
  comparison: z.record(z.string(), z.unknown()),
});
export type ComparePlansResponse = z.infer<typeof ComparePlansResponseSchema>;
