import { z } from 'zod';

export const AppSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  APP_NAME: z.string().min(1).default('app'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  BASE_URL: z.string().url().optional(),
});

export type AppConfig = z.infer<typeof AppSchema>;
