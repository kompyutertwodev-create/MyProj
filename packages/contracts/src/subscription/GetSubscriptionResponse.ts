import { z } from 'zod';
import { SubscriptionDtoSchema } from './SubscriptionDto';

export const GetSubscriptionResponseSchema = z.object({
  subscription: SubscriptionDtoSchema,
});
export type GetSubscriptionResponse = z.infer<typeof GetSubscriptionResponseSchema>;
