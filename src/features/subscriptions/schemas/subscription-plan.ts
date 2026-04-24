import { z } from 'zod';

export const subscriptionPlanSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  slug: z.string().min(2, 'Slug is required'),
  description: z.string().nullable(),
  serviceId: z.number().nullable(),
  price: z.number().positive('Price must be greater than zero'),
  interval: z.enum(['ONE_TIME', 'LIFETIME', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY']),
  isActive: z.boolean()
});

export type SubscriptionPlanFormValues = z.infer<typeof subscriptionPlanSchema>;
