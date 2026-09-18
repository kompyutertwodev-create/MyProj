import { z } from 'zod';

export const StreamSegmentResponseSchema = z.object({
  segment: z.string(),
});
export type StreamSegmentResponse = z.infer<typeof StreamSegmentResponseSchema>;
