import { z } from 'zod';

export const SendEmailRequestSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1),
  body: z.string().min(1),
  templateId: z.string().optional(),
  variables: z.record(z.unknown()).optional(),
});
export type SendEmailRequest = z.infer<typeof SendEmailRequestSchema>;
