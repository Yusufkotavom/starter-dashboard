import { queryOptions } from '@tanstack/react-query';
import { getClients, getClientById } from './service';
import type { Client, ClientFilters } from './types';

export type { Client };

export const clientKeys = {
  all: ['clients'] as const,
  list: (filters: ClientFilters) => [...clientKeys.all, 'list', filters] as const,
  detail: (id: number) => [...clientKeys.all, 'detail', id] as const
};

export const clientsQueryOptions = (filters: ClientFilters) =>
  queryOptions({
    queryKey: clientKeys.list(filters),
    queryFn: () => getClients(filters)
  });

export const clientByIdOptions = (id: number) =>
  queryOptions({
    queryKey: clientKeys.detail(id),
    queryFn: () => getClientById(id)
  });
