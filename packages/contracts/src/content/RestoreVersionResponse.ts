import { z } from 'zod';

export const RestoreVersionResponseSchema = z.object({
  restored: z.literal(true),
});

export type RestoreVersionResponse = z.infer<typeof RestoreVersionResponseSchema>;
