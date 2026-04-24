import * as z from 'zod';

export const categorySchema = z.object({
  name: z.string().min(2, 'Category name must be at least 2 characters.'),
  slug: z
    .string()
    .min(2, 'Slug must be at least 2 characters.')
    .regex(/^[a-z0-9-]+$/, 'Use lowercase letters, numbers, and hyphens only.'),
  description: z.string().max(500, 'Description must be 500 characters or less.')
});

export type CategoryFormValues = {
  name: string;
  slug: string;
  description: string;
};
