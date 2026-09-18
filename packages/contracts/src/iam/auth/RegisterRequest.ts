import { z } from 'zod';

export const RegisterRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  displayName: z.string().min(1),
});
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;
