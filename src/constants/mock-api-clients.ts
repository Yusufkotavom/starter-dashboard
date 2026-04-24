////////////////////////////////////////////////////////////////////////////////
// 🛑 Nothing in here has anything to do with Nextjs, it's just a fake database
////////////////////////////////////////////////////////////////////////////////

import { faker } from '@faker-js/faker';
import { matchSorter } from 'match-sorter';
import { delay } from './mock-api';

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

function getClientSortValue(client: Client, key: string): unknown {
  return client[key as keyof Client];
}

export const fakeClients = {
  records: [] as Client[],

  initialize() {
    const statuses: ClientStatus[] = ['LEAD', 'ACTIVE', 'ACTIVE', 'ACTIVE', 'INACTIVE', 'ARCHIVED'];
    const sampleClients: Client[] = [];

    for (let i = 1; i <= 60; i++) {
      const company = faker.helpers.maybe(() => faker.company.name(), { probability: 0.75 });
      sampleClients.push({
        id: i,
        name: faker.person.fullName(),
        email: faker.internet.email().toLowerCase(),
        phone:
          faker.helpers.maybe(() => faker.phone.number({ style: 'national' }), {
            probability: 0.8
          }) ?? null,
        company: company ?? null,
        address:
          faker.helpers.maybe(
            () =>
              `${faker.location.streetAddress()}, ${faker.location.city()}, ${faker.location.country()}`,
            { probability: 0.6 }
          ) ?? null,
        status: faker.helpers.arrayElement(statuses),
        notes: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.4 }) ?? null,
        createdAt: faker.date.between({ from: '2023-01-01', to: '2025-12-31' }).toISOString(),
        updatedAt: faker.date.recent({ days: 90 }).toISOString()
      });
    }

    this.records = sampleClients;
  },

  async getAll({ search, status }: { search?: string; status?: string }): Promise<Client[]> {
    let clients = [...this.records];

    // Status filter
    if (status) {
      const statusList = status.split(',').map((s) => s.trim().toUpperCase());
      clients = clients.filter((c) => statusList.includes(c.status));
    }

    // Full-text search over name, email, company
    if (search) {
      clients = matchSorter(clients, search, {
        keys: ['name', 'email', 'company']
      });
    }

    return clients;
  },

  async getClients({
    page = 1,
    limit = 10,
    search,
    status,
    sort
  }: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    sort?: string;
  }): Promise<{ items: Client[]; total_items: number }> {
    await delay(800);

    const allClients = await this.getAll({ search, status });

    // Sorting
    if (sort) {
      try {
        const sortItems = JSON.parse(sort) as { id: string; desc: boolean }[];
        if (sortItems.length > 0) {
          const { id, desc } = sortItems[0];
          allClients.sort((a, b) => {
            const aVal = getClientSortValue(a, id) ?? '';
            const bVal = getClientSortValue(b, id) ?? '';
            if (typeof aVal === 'number' && typeof bVal === 'number') {
              return desc ? bVal - aVal : aVal - bVal;
            }
            return desc
              ? String(bVal).localeCompare(String(aVal))
              : String(aVal).localeCompare(String(bVal));
          });
        }
      } catch {
        // Invalid sort param — ignore
      }
    }

    const total_items = allClients.length;
    const offset = (page - 1) * limit;
    const items = allClients.slice(offset, offset + limit);

    return { items, total_items };
  },

  async getClientById(id: number): Promise<Client | null> {
    await delay(500);
    return this.records.find((c) => c.id === id) ?? null;
  },

  async createClient(data: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Promise<Client> {
    await delay(800);
    const newClient: Client = {
      ...data,
      id: Math.max(0, ...this.records.map((c) => c.id)) + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.records.unshift(newClient);
    return newClient;
  },

  async updateClient(
    id: number,
    data: Partial<Omit<Client, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<Client> {
    await delay(800);
    const index = this.records.findIndex((c) => c.id === id);
    if (index === -1) throw new Error(`Client with ID ${id} not found`);
    this.records[index] = {
      ...this.records[index],
      ...data,
      updatedAt: new Date().toISOString()
    };
    return this.records[index];
  },

  async deleteClient(id: number): Promise<void> {
    await delay(800);
    const index = this.records.findIndex((c) => c.id === id);
    if (index === -1) throw new Error(`Client with ID ${id} not found`);
    this.records.splice(index, 1);
  }
};

fakeClients.initialize();
