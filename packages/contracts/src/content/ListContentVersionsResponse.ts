import { z } from 'zod';
import { ContentVersionDtoSchema } from './ContentVersionDto';

export const ListContentVersionsResponseSchema = z.array(ContentVersionDtoSchema);

export type ListContentVersionsResponse = z.infer<typeof ListContentVersionsResponseSchema>;
