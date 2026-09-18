import { z } from 'zod';

export const CreateUserRequestSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().optional(),
  role: z.string().optional(),
});
export type CreateUserRequest = z.infer<typeof CreateUserRequestSchema>;
