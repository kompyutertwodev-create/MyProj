import { z } from 'zod';

export const ValidateTokenResponseSchema = z.object({
  valid: z.literal(true),
  user: z.object({
    id: z.string(),
    email: z.string().email(),
    role: z.string(),
  }),
});
export type ValidateTokenResponse = z.infer<typeof ValidateTokenResponseSchema>;
