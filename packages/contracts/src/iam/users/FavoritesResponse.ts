import { z } from 'zod';

export const FavoritesResponseSchema = z.object({
  favorited: z.boolean(),
});
export type FavoritesResponse = z.infer<typeof FavoritesResponseSchema>;
