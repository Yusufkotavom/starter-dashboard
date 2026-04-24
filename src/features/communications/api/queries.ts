import { queryOptions } from '@tanstack/react-query';
import { getCommunicationById, getCommunications } from './service';
import type { CommunicationDetail, CommunicationFilters } from './types';

export type { CommunicationConversation, CommunicationDetail } from './types';

export const communicationKeys = {
  all: ['communications'] as const,
  list: (filters: CommunicationFilters) => [...communicationKeys.all, 'list', filters] as const,
  detail: (id: number | string) => [...communicationKeys.all, 'detail', id] as const
};

export const communicationsQueryOptions = (filters: CommunicationFilters) =>
  queryOptions({
    queryKey: communicationKeys.list(filters),
    queryFn: () => getCommunications(filters)
  });

export const communicationByIdOptions = (id: number | string) =>
  queryOptions({
    queryKey: communicationKeys.detail(id),
    queryFn: () => getCommunicationById(id)
  });

export type { CommunicationDetail as CommunicationThread };
