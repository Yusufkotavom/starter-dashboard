export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'PARTIAL' | 'OVERDUE' | 'CANCELLED';

export interface Invoice {
  id: number;
  number: string;
  clientId: number;
  clientName: string;
  projectId: number | null;
  projectName: string | null;
  status: InvoiceStatus;
  total: number;
  paidAmount: number;
  balanceDue: number;
  dueDate: string | null;
  paidAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sort?: string;
}

export interface InvoicesResponse {
  items: Invoice[];
  total_items: number;
}

export interface InvoiceMutationPayload {
  number: string;
  clientId: number;
  projectId?: number | null;
  status: InvoiceStatus;
  total: number;
  dueDate?: string | null;
  paidAt?: string | null;
  notes?: string | null;
}
