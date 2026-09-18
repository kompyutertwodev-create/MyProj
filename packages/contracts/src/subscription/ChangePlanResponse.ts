import { z } from 'zod';
import { SubscriptionDtoSchema } from './SubscriptionDto';

export const ChangePlanResponseSchema = z.object({
  changed: z.literal(true),
  subscription: SubscriptionDtoSchema,
});
export type ChangePlanResponse = z.infer<typeof ChangePlanResponseSchema>;
