import { z } from 'zod';
import { paginatedResponseSchema } from '../common/Pagination';
import { ContentDtoSchema } from './ContentDto';

export const ListContentResponseSchema = paginatedResponseSchema(ContentDtoSchema);

export type ListContentResponse = z.infer<typeof ListContentResponseSchema>;
