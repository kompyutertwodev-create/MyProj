import { z } from 'zod';

export const PauseHistoryResponseSchema = z.object({
  paused: z.literal(true),
});
export type PauseHistoryResponse = z.infer<typeof PauseHistoryResponseSchema>;
