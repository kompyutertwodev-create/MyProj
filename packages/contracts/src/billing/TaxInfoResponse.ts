import { z } from 'zod';

export const TaxInfoResponseSchema = z.object({
  taxId: z.string().optional(),
  companyName: z.string().optional(),
  address: z.string().optional(),
  taxRate: z.number().optional(),
});
export type TaxInfoResponse = z.infer<typeof TaxInfoResponseSchema>;
