import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { createQuotation, deleteQuotation, updateQuotation } from './service';
import { quotationKeys } from './queries';
import type { QuotationMutationPayload } from './types';

export const createQuotationMutation = mutationOptions({
  mutationFn: (data: QuotationMutationPayload) => createQuotation(data),
  onSuccess: () => getQueryClient().invalidateQueries({ queryKey: quotationKeys.all })
});

export const updateQuotationMutation = mutationOptions({
  mutationFn: ({ id, values }: { id: number; values: QuotationMutationPayload }) =>
    updateQuotation(id, values),
  onSuccess: () => getQueryClient().invalidateQueries({ queryKey: quotationKeys.all })
});

export const deleteQuotationMutation = mutationOptions({
  mutationFn: (id: number) => deleteQuotation(id),
  onSuccess: () => getQueryClient().invalidateQueries({ queryKey: quotationKeys.all })
});
