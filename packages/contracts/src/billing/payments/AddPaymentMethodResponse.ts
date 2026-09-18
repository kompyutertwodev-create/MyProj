import { z } from 'zod';
import { PaymentMethodDtoSchema } from './PaymentMethodDto';

export const AddPaymentMethodResponseSchema = z.object({
  paymentMethod: PaymentMethodDtoSchema,
});
export type AddPaymentMethodResponse = z.infer<typeof AddPaymentMethodResponseSchema>;
