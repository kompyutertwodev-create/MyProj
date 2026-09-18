import { z } from 'zod';
import { SubscriptionDtoSchema } from './SubscriptionDto';

export const CreateSubscriptionResponseSchema = z.object({
  subscription: SubscriptionDtoSchema,
  paymentIntent: z.record(z.string(), z.unknown()),
});
export type CreateSubscriptionResponse = z.infer<typeof CreateSubscriptionResponseSchema>;
