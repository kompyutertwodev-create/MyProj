import { z } from 'zod';

export const PersonSearchRequestSchema = z.object({
  q: z.string(),
});
export type PersonSearchRequest = z.infer<typeof PersonSearchRequestSchema>;
