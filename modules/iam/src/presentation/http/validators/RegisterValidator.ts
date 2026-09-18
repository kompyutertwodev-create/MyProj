import { z } from 'zod';

export const RegisterRequestSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8),
    displayName: z.string().trim().min(1).max(100),
  }),
});
