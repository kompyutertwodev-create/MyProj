import { z } from 'zod';
import { ContentDtoSchema } from './ContentDto';
import { paginatedResponseSchema } from '../common/Pagination';

export const GetContentByMaturityResponseSchema = paginatedResponseSchema(ContentDtoSchema);
export type GetContentByMaturityResponse = z.infer<typeof GetContentByMaturityResponseSchema>;
