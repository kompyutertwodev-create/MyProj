import { z } from 'zod';

export const GetFeatureAccessResponseSchema = z.object({
  maxDevices: z.number().int(),
  maxQuality: z.string(),
  downloadsEnabled: z.boolean(),
  offlineEnabled: z.boolean(),
  adsEnabled: z.boolean(),
  customFeatures: z.record(z.string(), z.unknown()),
});
export type GetFeatureAccessResponse = z.infer<typeof GetFeatureAccessResponseSchema>;
