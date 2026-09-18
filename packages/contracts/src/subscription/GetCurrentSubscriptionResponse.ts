import { z } from 'zod';
import { SubscriptionDtoSchema } from './SubscriptionDto';

export const GetCurrentSubscriptionResponseSchema = SubscriptionDtoSchema;
export type GetCurrentSubscriptionResponse = z.infer<typeof GetCurrentSubscriptionResponseSchema>;
