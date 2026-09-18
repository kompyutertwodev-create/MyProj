import { z } from 'zod';
import { HistoryItemDtoSchema } from './HistoryItemDto';
import { paginatedResponseSchema } from '../common/Pagination';

export const GetWatchHistoryResponseSchema = paginatedResponseSchema(HistoryItemDtoSchema);
export type GetWatchHistoryResponse = z.infer<typeof GetWatchHistoryResponseSchema>;
