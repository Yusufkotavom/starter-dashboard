import { z } from 'zod';

const optionalNumber = z
  .union([z.number(), z.literal(''), z.null(), z.undefined()])
  .transform((value) => (value === '' || value === undefined ? null : value));

export const projectSchema = z
  .object({
    name: z.string().min(2, 'Project name must be at least 2 characters.'),
    clientId: z.number({ message: 'Client is required.' }).int().positive(),
    quotationId: z
      .number()
      .int()
      .min(0)
      .nullable()
      .optional()
      .transform((value) => value ?? 0)
      .refine(
        (value) => Number.isInteger(value) && value >= 0,
        'Quotation ID must be a positive number.'
      ),
    status: z.enum(['ACTIVE', 'COMPLETED', 'PAUSED', 'CANCELLED']),
    startDate: z.string().nullable().optional(),
    endDate: z.string().nullable().optional(),
    budget: optionalNumber.refine(
      (value) => value === null || value >= 0,
      'Budget must be zero or greater.'
    ),
    notes: z.string().nullable().optional()
  })
  .refine(
    (value) =>
      !value.startDate ||
      !value.endDate ||
      new Date(value.startDate).getTime() <= new Date(value.endDate).getTime(),
    {
      message: 'End date must be after the start date.',
      path: ['endDate']
    }
  );

export type ProjectFormValues = z.input<typeof projectSchema>;
