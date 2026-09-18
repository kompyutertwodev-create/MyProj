import { z } from 'zod';

export const ConnectAccountResponseSchema = z.object({
  connected: z.literal(true),
});
export type ConnectAccountResponse = z.infer<typeof ConnectAccountResponseSchema>;
