import { z } from 'zod';
import { ContentDtoSchema } from './ContentDto';
import { paginatedResponseSchema } from '../common/Pagination';

export const GetContentListResponseSchema = paginatedResponseSchema(ContentDtoSchema);
export type GetContentListResponse = z.infer<typeof GetContentListResponseSchema>;
