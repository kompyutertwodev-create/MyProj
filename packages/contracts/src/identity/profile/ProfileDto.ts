import { z } from 'zod';

export const ProfileDtoSchema = z.object({
  id: z.string(),
  accountId: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  username: z.string().optional(),
  displayName: z.string().optional(),
  avatarUrl: z.string().optional(),
  bio: z.string().optional(),
  country: z.string().optional(),
  language: z.string().optional(),
  timezone: z.string().optional(),
  status: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type ProfileDto = z.infer<typeof ProfileDtoSchema>;
