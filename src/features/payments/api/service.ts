import { fakePayments } from '@/constants/mock-api-payments';
import type { Payment, PaymentFilters, PaymentsResponse, PaymentMutationPayload } from './types';

export async function getPayments(filters: PaymentFilters): Promise<PaymentsResponse> {
  return fakePayments.getPayments(filters);
}

export async function getPaymentById(id: number): Promise<Payment | null> {
  return fakePayments.getPaymentById(id);
}

export async function createPayment(data: PaymentMutationPayload): Promise<Payment> {
  return fakePayments.createPayment({
    invoiceId: data.invoiceId,
    amount: data.amount,
    method: data.method,
    reference: data.reference ?? null,
    paidAt: data.paidAt,
    notes: data.notes ?? null
  });
}

export async function updatePayment(id: number, data: PaymentMutationPayload): Promise<Payment> {
  return fakePayments.updatePayment(id, {
    invoiceId: data.invoiceId,
    amount: data.amount,
    method: data.method,
    reference: data.reference ?? null,
    paidAt: data.paidAt,
    notes: data.notes ?? null
  });
}

export async function deletePayment(id: number): Promise<void> {
  return fakePayments.deletePayment(id);
}
