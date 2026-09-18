import { z } from 'zod';

export const ChangePlanRequestSchema = z.object({
  planId: z.string(),
});
export type ChangePlanRequest = z.infer<typeof ChangePlanRequestSchema>;
