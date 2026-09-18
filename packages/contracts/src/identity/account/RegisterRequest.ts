import { z } from 'zod';

export const RegisterRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().optional(),
  username: z.string().optional(),
  displayName: z.string().optional(),
  acceptTerms: z.boolean(),
});
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;
