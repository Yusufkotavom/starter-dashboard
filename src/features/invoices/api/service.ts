import { fakeInvoices } from '@/constants/mock-api-invoices';
import type { Invoice, InvoiceFilters, InvoicesResponse, InvoiceMutationPayload } from './types';

export async function getInvoices(filters: InvoiceFilters): Promise<InvoicesResponse> {
  return fakeInvoices.getInvoices(filters);
}

export async function getInvoiceById(id: number): Promise<Invoice | null> {
  return fakeInvoices.getInvoiceById(id);
}

export async function createInvoice(data: InvoiceMutationPayload): Promise<Invoice> {
  return fakeInvoices.createInvoice({
    number: data.number,
    clientId: data.clientId,
    projectId: data.projectId ?? null,
    status: data.status,
    total: data.total,
    dueDate: data.dueDate ?? null,
    paidAt: data.paidAt ?? null,
    notes: data.notes ?? null
  });
}

export async function updateInvoice(id: number, data: InvoiceMutationPayload): Promise<Invoice> {
  return fakeInvoices.updateInvoice(id, {
    number: data.number,
    clientId: data.clientId,
    projectId: data.projectId ?? null,
    status: data.status,
    total: data.total,
    dueDate: data.dueDate ?? null,
    paidAt: data.paidAt ?? null,
    notes: data.notes ?? null
  });
}

export async function deleteInvoice(id: number): Promise<void> {
  return fakeInvoices.deleteInvoice(id);
}
