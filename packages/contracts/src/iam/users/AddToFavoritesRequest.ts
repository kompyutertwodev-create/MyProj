import { z } from 'zod';

export const AddToFavoritesRequestSchema = z.object({
  contentId: z.string(),
});
export type AddToFavoritesRequest = z.infer<typeof AddToFavoritesRequestSchema>;
