import { z } from 'zod';

export const PublicProfileDtoSchema = z.object({
  id: z.string(),
  username: z.string().optional(),
  displayName: z.string().optional(),
  avatarUrl: z.string().optional(),
  bio: z.string().optional(),
  country: z.string().optional(),
});
export type PublicProfileDto = z.infer<typeof PublicProfileDtoSchema>;
