import { z } from 'zod';

export const StartTrialResponseSchema = z.object({
  trialStarted: z.literal(true),
  trialEndsAt: z.string().datetime(),
});
export type StartTrialResponse = z.infer<typeof StartTrialResponseSchema>;
