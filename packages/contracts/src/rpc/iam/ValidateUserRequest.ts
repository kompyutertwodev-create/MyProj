import { z } from 'zod';

export const ValidateUserRequestSchema = z.object({
  userId: z.string(),
});
export type ValidateUserRequest = z.infer<typeof ValidateUserRequestSchema>;
