import { z } from 'zod';

export const UserRatingItemDtoSchema = z.object({
  contentId: z.string(),
  rating: z.number().int().min(1).max(10),
  createdAt: z.string().datetime(),
  content: z.unknown(),
});
export type UserRatingItemDto = z.infer<typeof UserRatingItemDtoSchema>;
