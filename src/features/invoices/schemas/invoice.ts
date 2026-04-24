import { z } from 'zod';

export const invoiceSchema = z.object({
  number: z.string().optional().default(''),
  clientId: z.number({ message: 'Client is required.' }).int().positive(),
  projectId: z.number().int().min(0),
  status: z.enum(['DRAFT', 'SENT', 'PAID', 'PARTIAL', 'OVERDUE', 'CANCELLED']),
  total: z.number({ message: 'Total is required.' }).nonnegative(),
  dueDate: z.string().nullable().optional(),
  paidAt: z.string().nullable().optional(),
  notes: z.string().nullable().optional()
});

export type InvoiceFormValues = z.input<typeof invoiceSchema>;
