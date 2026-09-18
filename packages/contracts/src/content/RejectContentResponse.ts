import { z } from 'zod';

export const RejectContentResponseSchema = z.object({
  rejected: z.literal(true),
});

export type RejectContentResponse = z.infer<typeof RejectContentResponseSchema>;
