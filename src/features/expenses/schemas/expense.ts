import { z } from 'zod';

export const expenseSchema = z.object({
  projectId: z.number().int().min(0),
  category: z.string().min(1, 'Category is required.'),
  vendor: z.string().nullable().optional(),
  amount: z.number({ message: 'Amount is required.' }).nonnegative(),
  date: z.string().min(1, 'Date is required.'),
  notes: z.string().nullable().optional()
});

export type ExpenseFormValues = z.input<typeof expenseSchema>;
