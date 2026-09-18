import { z } from 'zod';

export const ChangeEmailRequestSchema = z.object({
  newEmail: z.string().email(),
  password: z.string(),
});
export type ChangeEmailRequest = z.infer<typeof ChangeEmailRequestSchema>;
