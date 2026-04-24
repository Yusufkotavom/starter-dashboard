import * as z from 'zod';

const MAX_FILE_SIZE = 5_000_000;
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export const productSchema = z.object({
  image: z
    .any()
    // Make image optional for edit mode. Using basic validation here.
    .refine((files) => !files || files?.length === 0 || files?.length === 1, 'Max 1 image.')
    .refine(
      (files) => !files || files?.length === 0 || files?.[0]?.size <= MAX_FILE_SIZE,
      'Max file size is 5MB.'
    )
    .refine(
      (files) => !files || files?.length === 0 || ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
      '.jpg, .jpeg, .png and .webp files are accepted.'
    ),
  name: z.string().min(2, 'Product name must be at least 2 characters.'),
  category: z.string().min(1, 'Please select a category'),
  type: z.enum(['product', 'service']),
  isDigital: z.boolean(),
  deliveryUrl: z.string(),
  price: z.number({ message: 'Price is required' }),
  description: z.string().min(10, 'Description must be at least 10 characters.')
});

export type ProductFormValues = {
  image: File[] | undefined;
  name: string;
  category: string;
  type: 'product' | 'service';
  isDigital: boolean;
  deliveryUrl: string;
  price: number | undefined;
  description: string;
};
