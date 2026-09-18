import { z } from 'zod';

export const RedisSchema = z.object({
  REDIS_URL: z.string().url().default('redis://localhost:6379'),
  REDIS_TTL_SECONDS: z.coerce.number().int().positive().default(3600),
});

export type RedisConfig = z.infer<typeof RedisSchema>;
