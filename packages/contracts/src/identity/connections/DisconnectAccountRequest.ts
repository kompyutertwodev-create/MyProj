import { z } from 'zod';

export const DisconnectAccountRequestSchema = z.object({
  password: z.string(),
});
export type DisconnectAccountRequest = z.infer<typeof DisconnectAccountRequestSchema>;
