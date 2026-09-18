import { z } from 'zod';

export const RevokeAllSessionsRequestSchema = z.object({
  currentPassword: z.string(),
});
export type RevokeAllSessionsRequest = z.infer<typeof RevokeAllSessionsRequestSchema>;
