import { z } from 'zod';

export const CancelProcessingResponseSchema = z.object({
  cancelled: z.literal(true),
});
export type CancelProcessingResponse = z.infer<typeof CancelProcessingResponseSchema>;
