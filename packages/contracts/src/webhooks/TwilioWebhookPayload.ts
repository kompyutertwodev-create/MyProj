import { z } from 'zod';

export const TwilioWebhookPayloadSchema = z.object({
  messageSid: z.string().optional(),
  accountSid: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  body: z.string().optional(),
  messageStatus: z.string().optional(),
  smsStatus: z.string().optional(),
  errorCode: z.string().optional(),
  errorMessage: z.string().optional(),
});
export type TwilioWebhookPayload = z.infer<typeof TwilioWebhookPayloadSchema>;
