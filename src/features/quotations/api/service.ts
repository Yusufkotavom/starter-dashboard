import { apiClient } from '@/lib/api-client';
import type {
  Quotation,
  QuotationFilters,
  QuotationsResponse,
  QuotationMutationPayload
} from './types';

function createQuotationQueryString(filters: QuotationFilters): string {
  const searchParams = new URLSearchParams();

  if (filters.page) searchParams.set('page', String(filters.page));
  if (filters.limit) searchParams.set('limit', String(filters.limit));
  if (filters.search) searchParams.set('search', filters.search);
  if (filters.status) searchParams.set('status', filters.status);
  if (filters.sort) searchParams.set('sort', filters.sort);

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

export async function getQuotations(filters: QuotationFilters): Promise<QuotationsResponse> {
  return apiClient<QuotationsResponse>(`/quotations${createQuotationQueryString(filters)}`);
}

export async function getQuotationById(id: number): Promise<Quotation | null> {
  return apiClient<Quotation>(`/quotations/${id}`);
}

export async function createQuotation(data: QuotationMutationPayload): Promise<Quotation> {
  return apiClient<Quotation>('/quotations', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function updateQuotation(
  id: number,
  data: QuotationMutationPayload
): Promise<Quotation> {
  return apiClient<Quotation>(`/quotations/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

export async function deleteQuotation(id: number): Promise<void> {
  await apiClient(`/quotations/${id}`, {
    method: 'DELETE'
  });
}

export async function sendQuotation(id: number): Promise<{
  success: boolean;
  provider: string;
  messageId: string;
  status: string;
  documentUrl?: string;
}> {
  return apiClient(`/quotations/${id}/send`, {
    method: 'POST'
  });
}

export async function sendQuotationViaWhatsApp(id: number): Promise<{
  success: boolean;
  provider: string;
  messageId: string;
  status: string;
  documentUrl?: string;
  conversationId?: number;
}> {
  return apiClient(`/quotations/${id}/send-whatsapp`, {
    method: 'POST'
  });
}

export async function markQuotationAsSent(id: number): Promise<{
  success: boolean;
  quotationId: number;
  status: string;
}> {
  return apiClient(`/quotations/${id}/mark-sent`, {
    method: 'POST'
  });
}

export async function approveQuotation(id: number): Promise<{
  success: boolean;
  quotationId: number;
  quotationNumber: string;
  invoiceId: number;
  invoiceNumber: string;
}> {
  return apiClient(`/quotations/${id}/approve`, {
    method: 'POST'
  });
}
