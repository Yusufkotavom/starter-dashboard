export type ClientStatus = 'LEAD' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

export interface Client {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  address: string | null;
  status: ClientStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ClientFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sort?: string;
}

export interface ClientsResponse {
  items: Client[];
  total_items: number;
}

export interface ClientMutationPayload {
  name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  address?: string | null;
  status: ClientStatus;
  notes?: string | null;
}
