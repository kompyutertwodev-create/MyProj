import { z } from 'zod';

export const DeleteAccountRequestSchema = z.object({
  password: z.string(),
  confirmation: z.boolean(),
});
export type DeleteAccountRequest = z.infer<typeof DeleteAccountRequestSchema>;
