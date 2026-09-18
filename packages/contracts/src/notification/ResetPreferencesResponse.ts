import { z } from 'zod';

export const ResetPreferencesResponseSchema = z.object({
  reset: z.literal(true),
});
export type ResetPreferencesResponse = z.infer<typeof ResetPreferencesResponseSchema>;
