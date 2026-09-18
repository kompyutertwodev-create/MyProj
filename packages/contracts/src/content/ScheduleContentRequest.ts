import { z } from 'zod';

export const ScheduleContentRequestSchema = z.object({
  publishAt: z.string().datetime(),
});

export type ScheduleContentRequest = z.infer<typeof ScheduleContentRequestSchema>;
