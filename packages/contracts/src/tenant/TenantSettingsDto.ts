import { z } from 'zod';

export const TenantSettingsDtoSchema = z.object({
  timezone: z.string().optional(),
  language: z.string().optional(),
  branding: z.record(z.string(), z.unknown()).optional(),
});
export type TenantSettingsDto = z.infer<typeof TenantSettingsDtoSchema>;
