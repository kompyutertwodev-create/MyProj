import { z } from 'zod';

export const ExtendSessionResponseSchema = z.object({
  expiresAt: z.string().datetime(),
});
export type ExtendSessionResponse = z.infer<typeof ExtendSessionResponseSchema>;
