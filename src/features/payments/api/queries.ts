import { queryOptions } from '@tanstack/react-query';
import { getPaymentById, getPayments } from './service';
import type { Payment, PaymentFilters } from './types';

export type { Payment };

export const paymentKeys = {
  all: ['payments'] as const,
  list: (filters: PaymentFilters) => [...paymentKeys.all, 'list', filters] as const,
  detail: (id: number) => [...paymentKeys.all, 'detail', id] as const
};

export const paymentsQueryOptions = (filters: PaymentFilters) =>
  queryOptions({
    queryKey: paymentKeys.list(filters),
    queryFn: () => getPayments(filters)
  });

export const paymentByIdOptions = (id: number) =>
  queryOptions({
    queryKey: paymentKeys.detail(id),
    queryFn: () => getPaymentById(id)
  });
