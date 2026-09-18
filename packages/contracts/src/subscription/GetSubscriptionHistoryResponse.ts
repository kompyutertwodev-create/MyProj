import { z } from 'zod';
import { paginatedResponseSchema } from '../common/Pagination';
import { SubscriptionDtoSchema } from './SubscriptionDto';

export const GetSubscriptionHistoryResponseSchema = paginatedResponseSchema(SubscriptionDtoSchema);
export type GetSubscriptionHistoryResponse = z.infer<typeof GetSubscriptionHistoryResponseSchema>;
