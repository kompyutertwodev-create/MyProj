import { z } from 'zod';
import { CollectionDtoSchema } from './CollectionDto';
import { ContentDtoSchema } from './ContentDto';

export const CollectionDetailResponseSchema = z.object({
  collection: CollectionDtoSchema,
  items: z.array(ContentDtoSchema),
});
export type CollectionDetailResponse = z.infer<typeof CollectionDetailResponseSchema>;
