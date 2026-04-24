import { fakeClients } from '@/constants/mock-api-clients';
import type { Client, ClientFilters, ClientsResponse, ClientMutationPayload } from './types';

export async function getClients(filters: ClientFilters): Promise<ClientsResponse> {
  return fakeClients.getClients(filters);
}

export async function getClientById(id: number): Promise<Client | null> {
  return fakeClients.getClientById(id);
}

export async function createClient(data: ClientMutationPayload): Promise<Client> {
  return fakeClients.createClient({
    name: data.name,
    email: data.email,
    phone: data.phone ?? null,
    company: data.company ?? null,
    address: data.address ?? null,
    status: data.status,
    notes: data.notes ?? null
  });
}

export async function updateClient(id: number, data: ClientMutationPayload): Promise<Client> {
  return fakeClients.updateClient(id, {
    name: data.name,
    email: data.email,
    phone: data.phone ?? null,
    company: data.company ?? null,
    address: data.address ?? null,
    status: data.status,
    notes: data.notes ?? null
  });
}

export async function deleteClient(id: number): Promise<void> {
  return fakeClients.deleteClient(id);
}
