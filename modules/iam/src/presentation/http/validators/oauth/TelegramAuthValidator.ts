import { z } from 'zod';

export const TelegramAuthRequestSchema = z.object({
  id: z.number().int().positive('Telegram user ID is required'),
  first_name: z.string().min(1),
  last_name: z.string().optional(),
  username: z.string().optional(),
  photo_url: z.string().url().optional(),
  auth_date: z.number().int().positive(),
  hash: z.string().min(1, 'Hash is required'),
});

export type TelegramAuthRequest = z.infer<typeof TelegramAuthRequestSchema>;
