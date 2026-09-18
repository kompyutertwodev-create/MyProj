import { z } from 'zod';

export const ConvertTrialRequestSchema = z.object({
  paymentMethodId: z.string(),
});
export type ConvertTrialRequest = z.infer<typeof ConvertTrialRequestSchema>;
