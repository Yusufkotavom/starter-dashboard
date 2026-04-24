import { queryOptions } from '@tanstack/react-query';
import { getQuotationById, getQuotations } from './service';
import type { Quotation, QuotationFilters } from './types';

export type { Quotation };

export const quotationKeys = {
  all: ['quotations'] as const,
  list: (filters: QuotationFilters) => [...quotationKeys.all, 'list', filters] as const,
  detail: (id: number) => [...quotationKeys.all, 'detail', id] as const
};

export const quotationsQueryOptions = (filters: QuotationFilters) =>
  queryOptions({
    queryKey: quotationKeys.list(filters),
    queryFn: () => getQuotations(filters)
  });

export const quotationByIdOptions = (id: number) =>
  queryOptions({
    queryKey: quotationKeys.detail(id),
    queryFn: () => getQuotationById(id)
  });
