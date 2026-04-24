import { queryOptions } from '@tanstack/react-query';
import { getInvoiceById, getInvoices } from './service';
import type { Invoice, InvoiceFilters } from './types';

export type { Invoice };

export const invoiceKeys = {
  all: ['invoices'] as const,
  list: (filters: InvoiceFilters) => [...invoiceKeys.all, 'list', filters] as const,
  detail: (id: number) => [...invoiceKeys.all, 'detail', id] as const
};

export const invoicesQueryOptions = (filters: InvoiceFilters) =>
  queryOptions({
    queryKey: invoiceKeys.list(filters),
    queryFn: () => getInvoices(filters)
  });

export const invoiceByIdOptions = (id: number) =>
  queryOptions({
    queryKey: invoiceKeys.detail(id),
    queryFn: () => getInvoiceById(id)
  });
