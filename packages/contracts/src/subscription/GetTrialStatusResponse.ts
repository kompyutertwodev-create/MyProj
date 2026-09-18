import { z } from 'zod';

export const GetTrialStatusResponseSchema = z.object({
  eligible: z.boolean(),
  daysRemaining: z.number().int(),
  endsAt: z.string().datetime(),
});
export type GetTrialStatusResponse = z.infer<typeof GetTrialStatusResponseSchema>;
