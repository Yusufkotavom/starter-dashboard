export type PaymentMethod = 'BANK_TRANSFER' | 'QRIS' | 'CASH' | 'CARD';

export interface Payment {
  id: number;
  invoiceId: number;
  invoiceNumber: string;
  clientName: string;
  amount: number;
  method: PaymentMethod;
  reference: string | null;
  paidAt: string;
  notes: string | null;
  createdAt: string;
}

export interface PaymentFilters {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
}

export interface PaymentsResponse {
  items: Payment[];
  total_items: number;
}

export interface PaymentMutationPayload {
  invoiceId: number;
  amount: number;
  method: PaymentMethod;
  reference?: string | null;
  paidAt: string;
  notes?: string | null;
}
