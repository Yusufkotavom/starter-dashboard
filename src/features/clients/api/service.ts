import { apiClient } from '@/lib/api-client';
import type { Client, ClientFilters, ClientsResponse, ClientMutationPayload } from './types';

function createClientQueryString(filters: ClientFilters): string {
  const searchParams = new URLSearchParams();

  if (filters.page) searchParams.set('page', String(filters.page));
  if (filters.limit) searchParams.set('limit', String(filters.limit));
  if (filters.search) searchParams.set('search', filters.search);
  if (filters.status) searchParams.set('status', filters.status);
  if (filters.sort) searchParams.set('sort', filters.sort);

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

export async function getClients(filters: ClientFilters): Promise<ClientsResponse> {
  return apiClient<ClientsResponse>(`/clients${createClientQueryString(filters)}`);
}

export async function getClientById(id: number): Promise<Client | null> {
  return apiClient<Client>(`/clients/${id}`);
}

export async function createClient(data: ClientMutationPayload): Promise<Client> {
  return apiClient<Client>('/clients', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function updateClient(id: number, data: ClientMutationPayload): Promise<Client> {
  return apiClient<Client>(`/clients/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

export async function deleteClient(id: number): Promise<void> {
  await apiClient(`/clients/${id}`, {
    method: 'DELETE'
  });
}
