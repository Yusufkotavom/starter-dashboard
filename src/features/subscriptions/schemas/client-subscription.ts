import { z } from 'zod';

export const clientSubscriptionSchema = z.object({
  clientId: z.number().positive('Client is required'),
  planId: z.number().positive('Plan is required'),
  projectId: z.number().nullable(),
  status: z.enum(['ACTIVE', 'PAUSED', 'CANCELLED', 'EXPIRED']),
  startDate: z.string().min(1, 'Start date is required'),
  nextBillingDate: z.string().nullable(),
  endDate: z.string().nullable(),
  autoRenew: z.boolean(),
  priceOverride: z.number().nullable(),
  notes: z.string().nullable()
});

export type ClientSubscriptionFormValues = z.infer<typeof clientSubscriptionSchema>;
