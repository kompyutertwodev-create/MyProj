import { z } from 'zod';
import { ContentDtoSchema } from './ContentDto';

export const CollectionDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string().optional(),
  items: z.array(ContentDtoSchema),
});
export type CollectionDto = z.infer<typeof CollectionDtoSchema>;
