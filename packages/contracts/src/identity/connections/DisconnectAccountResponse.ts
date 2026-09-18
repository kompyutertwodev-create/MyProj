import { z } from 'zod';

export const DisconnectAccountResponseSchema = z.object({
  disconnected: z.literal(true),
});
export type DisconnectAccountResponse = z.infer<typeof DisconnectAccountResponseSchema>;
