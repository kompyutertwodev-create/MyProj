import { z } from 'zod';

export const JwtSchema = z.object({
  JWT_SECRET: z.string().min(16),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('7d'),
  JWT_ISSUER: z.string().optional(),
  JWT_AUDIENCE: z.string().optional(),
});

export type JwtConfig = z.infer<typeof JwtSchema>;
