import { z } from 'zod';

export const ApproveContentRequestSchema = z.object({
  notes: z.string().optional(),
});

export type ApproveContentRequest = z.infer<typeof ApproveContentRequestSchema>;
