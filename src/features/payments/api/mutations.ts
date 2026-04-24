import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { createPayment, deletePayment, updatePayment } from './service';
import { paymentKeys } from './queries';
import type { PaymentMutationPayload } from './types';

export const createPaymentMutation = mutationOptions({
  mutationFn: (data: PaymentMutationPayload) => createPayment(data),
  onSuccess: () => getQueryClient().invalidateQueries({ queryKey: paymentKeys.all })
});

export const updatePaymentMutation = mutationOptions({
  mutationFn: ({ id, values }: { id: number; values: PaymentMutationPayload }) =>
    updatePayment(id, values),
  onSuccess: () => getQueryClient().invalidateQueries({ queryKey: paymentKeys.all })
});

export const deletePaymentMutation = mutationOptions({
  mutationFn: (id: number) => deletePayment(id),
  onSuccess: () => getQueryClient().invalidateQueries({ queryKey: paymentKeys.all })
});
