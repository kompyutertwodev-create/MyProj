import { z } from 'zod';

/** Request schema for `DELETE /policies/:id` (soft delete). */
export const DeletePolicyRequestSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    deletedBy: z.string().min(1),
  }),
});