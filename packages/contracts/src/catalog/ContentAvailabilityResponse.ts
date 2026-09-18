import { z } from 'zod';

export const ContentAvailabilityResponseSchema = z.object({
  available: z.boolean(),
  availableIn: z.array(z.string()),
  restricted: z.boolean(),
  restrictionReason: z.string().optional(),
});
export type ContentAvailabilityResponse = z.infer<typeof ContentAvailabilityResponseSchema>;
