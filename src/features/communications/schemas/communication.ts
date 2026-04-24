import { z } from 'zod';

export const attachClientSchema = z.object({
  clientId: z.number().min(1, 'Select a client')
});

export type AttachClientFormValues = z.infer<typeof attachClientSchema>;

export const sendMessageSchema = z.object({
  body: z
    .string()
    .min(1, 'Message is required')
    .max(2000, 'Message must be 2000 characters or less.')
});

export type SendMessageFormValues = z.infer<typeof sendMessageSchema>;
