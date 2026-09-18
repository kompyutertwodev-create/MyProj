import { z } from 'zod';

export const LikedContentItemDtoSchema = z.object({
  contentId: z.string(),
  content: z.unknown(),
});
export type LikedContentItemDto = z.infer<typeof LikedContentItemDtoSchema>;
