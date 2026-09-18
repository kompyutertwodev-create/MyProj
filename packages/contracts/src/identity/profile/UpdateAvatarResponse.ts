import { z } from 'zod';

export const UpdateAvatarResponseSchema = z.object({
  avatarUrl: z.string(),
});
export type UpdateAvatarResponse = z.infer<typeof UpdateAvatarResponseSchema>;
