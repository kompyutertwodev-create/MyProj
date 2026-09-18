import { z } from 'zod';

export const ScheduleContentResponseSchema = z.object({
  scheduled: z.literal(true),
  publishAt: z.string().datetime(),
});

export type ScheduleContentResponse = z.infer<typeof ScheduleContentResponseSchema>;
