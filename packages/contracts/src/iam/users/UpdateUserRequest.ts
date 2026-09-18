import { z } from 'zod';

export const UpdateUserRequestSchema = z.object({
  username: z.string().min(3).optional(),
  email: z.string().email().optional(),
  displayName: z.string().optional(),
  avatarUrl: z.string().optional(),
  role: z.string().optional(),
});
export type UpdateUserRequest = z.infer<typeof UpdateUserRequestSchema>;
