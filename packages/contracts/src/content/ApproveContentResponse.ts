import { z } from 'zod';

export const ApproveContentResponseSchema = z.object({
  approved: z.literal(true),
  approvedAt: z.string().datetime(),
});

export type ApproveContentResponse = z.infer<typeof ApproveContentResponseSchema>;
