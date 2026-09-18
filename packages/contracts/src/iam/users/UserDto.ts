import { z } from 'zod';

export const UserDtoSchema = z.object({
  id: z.string(),
  username: z.string(),
  email: z.string().email(),
  displayName: z.string().optional(),
  avatarUrl: z.string().optional(),
  status: z.enum(['active', 'suspended', 'banned']),
  role: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type UserDto = z.infer<typeof UserDtoSchema>;
