import { z } from 'zod';
import { ContentDtoSchema } from './ContentDto';

export const ContentListResponseSchema = z.object({
  data: z.array(ContentDtoSchema),
});
export type ContentListResponse = z.infer<typeof ContentListResponseSchema>;
