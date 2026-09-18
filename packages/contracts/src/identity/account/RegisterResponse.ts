import { z } from 'zod';

export const RegisterResponseSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  status: z.string(),
  createdAt: z.string().datetime(),
});
export type RegisterResponse = z.infer<typeof RegisterResponseSchema>;
