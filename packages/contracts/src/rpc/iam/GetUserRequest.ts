import { z } from 'zod';

export const GetUserRequestSchema = z.object({
  userId: z.string(),
});
export type GetUserRequest = z.infer<typeof GetUserRequestSchema>;
