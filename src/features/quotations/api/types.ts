export type QuotationStatus = 'DRAFT' | 'SENT' | 'APPROVED' | 'REJECTED' | 'EXPIRED';

export interface Quotation {
  id: number;
  number: string;
  clientId: number;
  clientName: string;
  clientCompany: string | null;
  serviceIds: number[];
  serviceNames: string[];
  status: QuotationStatus;
  total: number;
  validUntil: string | null;
  notes: string | null;
  itemsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface QuotationFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sort?: string;
}

export interface QuotationsResponse {
  items: Quotation[];
  total_items: number;
}

export interface QuotationMutationPayload {
  number?: string | null;
  clientId: number;
  serviceIds?: number[];
  status: QuotationStatus;
  total: number;
  validUntil?: string | null;
  notes?: string | null;
  itemsCount: number;
}
