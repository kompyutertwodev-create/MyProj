import { z } from 'zod';

export const SendSmsRequestSchema = z.object({
  to: z.string().min(1),
  body: z.string().min(1),
  templateId: z.string().optional(),
  variables: z.record(z.unknown()).optional(),
});
export type SendSmsRequest = z.infer<typeof SendSmsRequestSchema>;
