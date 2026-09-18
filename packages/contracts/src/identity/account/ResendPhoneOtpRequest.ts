import { z } from 'zod';

export const ResendPhoneOtpRequestSchema = z.object({
  phone: z.string(),
});
export type ResendPhoneOtpRequest = z.infer<typeof ResendPhoneOtpRequestSchema>;
