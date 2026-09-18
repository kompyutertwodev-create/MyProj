import { z } from 'zod';

export const StartTrialRequestSchema = z.object({
  planId: z.string(),
});
export type StartTrialRequest = z.infer<typeof StartTrialRequestSchema>;
