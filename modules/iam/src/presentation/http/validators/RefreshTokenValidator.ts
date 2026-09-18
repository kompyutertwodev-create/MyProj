import { z } from 'zod';

export const RefreshTokenRequestSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'refreshToken is required'),
  }),
});
