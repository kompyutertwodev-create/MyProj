import { z } from 'zod';
import { SubscriptionDtoSchema } from './SubscriptionDto';

export const ConvertTrialResponseSchema = z.object({
  converted: z.literal(true),
  subscription: SubscriptionDtoSchema,
});
export type ConvertTrialResponse = z.infer<typeof ConvertTrialResponseSchema>;
