import { z } from 'zod';

export const GetUserRequestSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid user ID format'),
  }),
});

export type GetUserRequest = z.infer<typeof GetUserRequestSchema>;
