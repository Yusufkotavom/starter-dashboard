import { apiClient } from '@/lib/api-client';
import type { Payment, PaymentFilters, PaymentsResponse, PaymentMutationPayload } from './types';

function createPaymentQueryString(filters: PaymentFilters): string {
  const searchParams = new URLSearchParams();

  if (filters.page) searchParams.set('page', String(filters.page));
  if (filters.limit) searchParams.set('limit', String(filters.limit));
  if (filters.search) searchParams.set('search', filters.search);
  if (filters.sort) searchParams.set('sort', filters.sort);

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

export async function getPayments(filters: PaymentFilters): Promise<PaymentsResponse> {
  return apiClient<PaymentsResponse>(`/payments${createPaymentQueryString(filters)}`);
}

export async function getPaymentById(id: number): Promise<Payment | null> {
  return apiClient<Payment>(`/payments/${id}`);
}

export async function createPayment(data: PaymentMutationPayload): Promise<Payment> {
  return apiClient<Payment>('/payments', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function updatePayment(id: number, data: PaymentMutationPayload): Promise<Payment> {
  return apiClient<Payment>(`/payments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

export async function deletePayment(id: number): Promise<void> {
  await apiClient(`/payments/${id}`, {
    method: 'DELETE'
  });
}
