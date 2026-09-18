import { z } from 'zod';

export const CancelScheduleResponseSchema = z.object({
  cancelled: z.literal(true),
});

export type CancelScheduleResponse = z.infer<typeof CancelScheduleResponseSchema>;
