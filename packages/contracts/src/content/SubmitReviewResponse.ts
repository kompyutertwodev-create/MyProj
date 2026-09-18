import { z } from 'zod';

export const SubmitReviewResponseSchema = z.object({
  submitted: z.literal(true),
});

export type SubmitReviewResponse = z.infer<typeof SubmitReviewResponseSchema>;
