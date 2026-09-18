import { z } from 'zod';

export const UnreadCountResponseSchema = z.object({
  count: z.number().int(),
});
export type UnreadCountResponse = z.infer<typeof UnreadCountResponseSchema>;
