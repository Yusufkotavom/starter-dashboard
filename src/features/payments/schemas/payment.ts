import { z } from 'zod';

export const paymentSchema = z.object({
  invoiceId: z.number({ message: 'Invoice is required.' }).int().positive(),
  amount: z.number({ message: 'Amount is required.' }).nonnegative(),
  method: z.enum(['BANK_TRANSFER', 'QRIS', 'CASH', 'CARD']),
  reference: z.string().nullable().optional(),
  paidAt: z.string().min(1, 'Paid date is required.'),
  notes: z.string().nullable().optional()
});

export type PaymentFormValues = z.input<typeof paymentSchema>;
