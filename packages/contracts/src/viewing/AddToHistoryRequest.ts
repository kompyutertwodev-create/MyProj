import { z } from 'zod';

export const AddToHistoryRequestSchema = z.object({
  contentId: z.string(),
  progress: z.number(),
});
export type AddToHistoryRequest = z.infer<typeof AddToHistoryRequestSchema>;
