import { fakeQuotations } from '@/constants/mock-api-quotations';
import type {
  Quotation,
  QuotationFilters,
  QuotationsResponse,
  QuotationMutationPayload
} from './types';

export async function getQuotations(filters: QuotationFilters): Promise<QuotationsResponse> {
  return fakeQuotations.getQuotations(filters);
}

export async function getQuotationById(id: number): Promise<Quotation | null> {
  return fakeQuotations.getQuotationById(id);
}

export async function createQuotation(data: QuotationMutationPayload): Promise<Quotation> {
  return fakeQuotations.createQuotation({
    number: data.number,
    clientId: data.clientId,
    status: data.status,
    total: data.total,
    validUntil: data.validUntil ?? null,
    notes: data.notes ?? null,
    itemsCount: data.itemsCount
  });
}

export async function updateQuotation(
  id: number,
  data: QuotationMutationPayload
): Promise<Quotation> {
  return fakeQuotations.updateQuotation(id, {
    number: data.number,
    clientId: data.clientId,
    status: data.status,
    total: data.total,
    validUntil: data.validUntil ?? null,
    notes: data.notes ?? null,
    itemsCount: data.itemsCount
  });
}

export async function deleteQuotation(id: number): Promise<void> {
  return fakeQuotations.deleteQuotation(id);
}
