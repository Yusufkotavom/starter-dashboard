import { z } from 'zod';

export const clientSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().nullable().optional(),
  company: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  status: z.enum(['LEAD', 'ACTIVE', 'INACTIVE', 'ARCHIVED'], {
    message: 'Please select a status'
  }),
  notes: z.string().nullable().optional()
});

export type ClientFormValues = z.infer<typeof clientSchema>;
