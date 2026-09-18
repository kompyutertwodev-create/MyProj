import { z } from 'zod';
import { ContentDtoSchema } from './ContentDto';

export const BatchContentResponseSchema = z.object({
  data: z.array(ContentDtoSchema),
});
export type BatchContentResponse = z.infer<typeof BatchContentResponseSchema>;
