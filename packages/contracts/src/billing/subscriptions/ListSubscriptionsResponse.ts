import { z } from 'zod';
import { paginatedResponseSchema } from '../../common/Pagination';
import { SubscriptionDtoSchema } from './SubscriptionDto';

export const ListSubscriptionsResponseSchema = paginatedResponseSchema(SubscriptionDtoSchema);
export type ListSubscriptionsResponse = z.infer<typeof ListSubscriptionsResponseSchema>;
