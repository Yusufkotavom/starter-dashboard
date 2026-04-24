import { z } from 'zod';

export const quotationSchema = z.object({
  number: z.string().min(3, 'Quotation number is required.'),
  clientId: z.number({ message: 'Client is required.' }).int().positive(),
  status: z.enum(['DRAFT', 'SENT', 'APPROVED', 'REJECTED', 'EXPIRED']),
  total: z.number({ message: 'Total is required.' }).nonnegative(),
  validUntil: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  itemsCount: z.number({ message: 'Items count is required.' }).int().min(1)
});

export type QuotationFormValues = z.input<typeof quotationSchema>;
