import { z } from 'zod';

export const ResumeHistoryResponseSchema = z.object({
  resumed: z.literal(true),
});
export type ResumeHistoryResponse = z.infer<typeof ResumeHistoryResponseSchema>;
