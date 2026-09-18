import { z } from 'zod';

export const SendPushRequestSchema = z.object({
  userId: z.string(),
  title: z.string().min(1),
  body: z.string().min(1),
  data: z.record(z.unknown()).optional(),
  templateId: z.string().optional(),
  variables: z.record(z.unknown()).optional(),
});
export type SendPushRequest = z.infer<typeof SendPushRequestSchema>;
