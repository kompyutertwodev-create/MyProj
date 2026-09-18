import { z } from 'zod';
import { PaymentDtoSchema } from './PaymentDto';

export const GetPaymentResponseSchema = z.object({
  payment: PaymentDtoSchema,
});
export type GetPaymentResponse = z.infer<typeof GetPaymentResponseSchema>;
