import { z } from 'zod';

export const ViewingSessionDtoSchema = z.object({
  sessionId: z.string(),
  contentId: z.string(),
  quality: z.string().optional(),
  deviceId: z.string(),
  streamUrl: z.string(),
  expiresIn: z.number(),
});
export type ViewingSessionDto = z.infer<typeof ViewingSessionDtoSchema>;
