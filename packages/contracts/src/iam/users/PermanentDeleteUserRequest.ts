import { z } from 'zod';

export const PermanentDeleteUserRequestSchema = z.object({
  confirmation: z.string(),
});
export type PermanentDeleteUserRequest = z.infer<typeof PermanentDeleteUserRequestSchema>;
