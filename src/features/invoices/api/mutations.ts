import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { createInvoice, deleteInvoice, updateInvoice } from './service';
import { invoiceKeys } from './queries';
import type { InvoiceMutationPayload } from './types';

export const createInvoiceMutation = mutationOptions({
  mutationFn: (data: InvoiceMutationPayload) => createInvoice(data),
  onSuccess: () => getQueryClient().invalidateQueries({ queryKey: invoiceKeys.all })
});

export const updateInvoiceMutation = mutationOptions({
  mutationFn: ({ id, values }: { id: number; values: InvoiceMutationPayload }) =>
    updateInvoice(id, values),
  onSuccess: () => getQueryClient().invalidateQueries({ queryKey: invoiceKeys.all })
});

export const deleteInvoiceMutation = mutationOptions({
  mutationFn: (id: number) => deleteInvoice(id),
  onSuccess: () => getQueryClient().invalidateQueries({ queryKey: invoiceKeys.all })
});
