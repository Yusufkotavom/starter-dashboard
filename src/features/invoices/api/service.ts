import { apiClient } from '@/lib/api-client';
import type { Invoice, InvoiceFilters, InvoicesResponse, InvoiceMutationPayload } from './types';

function createInvoiceQueryString(filters: InvoiceFilters): string {
  const searchParams = new URLSearchParams();

  if (filters.page) searchParams.set('page', String(filters.page));
  if (filters.limit) searchParams.set('limit', String(filters.limit));
  if (filters.search) searchParams.set('search', filters.search);
  if (filters.status) searchParams.set('status', filters.status);
  if (filters.sort) searchParams.set('sort', filters.sort);

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

export async function getInvoices(filters: InvoiceFilters): Promise<InvoicesResponse> {
  return apiClient<InvoicesResponse>(`/invoices${createInvoiceQueryString(filters)}`);
}

export async function getInvoiceById(id: number): Promise<Invoice | null> {
  return apiClient<Invoice>(`/invoices/${id}`);
}

export async function createInvoice(data: InvoiceMutationPayload): Promise<Invoice> {
  return apiClient<Invoice>('/invoices', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function updateInvoice(id: number, data: InvoiceMutationPayload): Promise<Invoice> {
  return apiClient<Invoice>(`/invoices/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

export async function deleteInvoice(id: number): Promise<void> {
  await apiClient(`/invoices/${id}`, {
    method: 'DELETE'
  });
}
