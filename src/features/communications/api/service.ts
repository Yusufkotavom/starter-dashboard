import { apiClient } from '@/lib/api-client';
import type {
  AttachClientPayload,
  CommunicationDetail,
  CommunicationFilters,
  CommunicationsResponse,
  SendCommunicationMessagePayload
} from './types';

function createCommunicationsQueryString(filters: CommunicationFilters): string {
  const searchParams = new URLSearchParams();

  if (filters.page) searchParams.set('page', String(filters.page));
  if (filters.limit) searchParams.set('limit', String(filters.limit));
  if (filters.search) searchParams.set('search', filters.search);
  if (filters.unreadOnly) searchParams.set('unreadOnly', 'true');

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

export async function getCommunications(
  filters: CommunicationFilters
): Promise<CommunicationsResponse> {
  return apiClient<CommunicationsResponse>(
    `/communications${createCommunicationsQueryString(filters)}`
  );
}

export async function getCommunicationById(id: number | string): Promise<CommunicationDetail> {
  return apiClient<CommunicationDetail>(`/communications/${id}`);
}

export async function attachCommunicationClient(
  id: number | string,
  data: AttachClientPayload
): Promise<{
  success: boolean;
  conversation: CommunicationDetail['conversation'];
}> {
  return apiClient(`/communications/${id}/attach-client`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function sendCommunicationMessage(
  id: number | string,
  data: SendCommunicationMessagePayload
): Promise<{
  success: boolean;
  provider: string;
  messageId: string;
  message: CommunicationDetail['messages'][number];
}> {
  return apiClient(`/communications/${id}/send`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}
