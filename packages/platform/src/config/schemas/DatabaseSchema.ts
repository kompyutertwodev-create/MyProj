import { z } from 'zod';

export const DatabaseSchema = z.object({
  DATABASE_URL: z.string().url(),
  DB_POOL_MIN: z.coerce.number().int().nonnegative().default(2),
  DB_POOL_MAX: z.coerce.number().int().positive().default(10),
});

export type DatabaseConfig = z.infer<typeof DatabaseSchema>;
