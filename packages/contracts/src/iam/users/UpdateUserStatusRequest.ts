import { z } from 'zod';

export const UpdateUserStatusRequestSchema = z.object({
  status: z.enum(['active', 'suspended', 'banned']),
});
export type UpdateUserStatusRequest = z.infer<typeof UpdateUserStatusRequestSchema>;
