import { z } from 'zod';

export const ValidateUserResponseSchema = z.object({
  valid: z.boolean(),
  userId: z.string(),
  status: z.enum(['active', 'suspended', 'banned', 'deleted']).optional(),
});
export type ValidateUserResponse = z.infer<typeof ValidateUserResponseSchema>;
