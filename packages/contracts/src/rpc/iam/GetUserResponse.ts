import { z } from 'zod';

export const GetUserResponseSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  displayName: z.string().optional(),
  status: z.enum(['active', 'suspended', 'banned', 'deleted']),
});
export type GetUserResponse = z.infer<typeof GetUserResponseSchema>;
