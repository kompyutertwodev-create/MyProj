import { z } from 'zod';
import { CollectionDtoSchema } from './CollectionDto';

export const GetCollectionsResponseSchema = z.array(CollectionDtoSchema);
export type GetCollectionsResponse = z.infer<typeof GetCollectionsResponseSchema>;
