////////////////////////////////////////////////////////////////////////////////
// Demo invoice store for agency workflow
////////////////////////////////////////////////////////////////////////////////

import { faker } from '@faker-js/faker';
import { matchSorter } from 'match-sorter';
import { delay } from './mock-api';
import { fakeClients } from './mock-api-clients';
import { fakeProjects } from './mock-api-projects';

export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'PARTIAL' | 'OVERDUE' | 'CANCELLED';

export interface Invoice {
  id: number;
  number: string;
  clientId: number;
  clientName: string;
  projectId: number | null;
  projectName: string | null;
  status: InvoiceStatus;
  total: number;
  dueDate: string | null;
  paidAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

type InvoiceWriteInput = Omit<
  Invoice,
  'id' | 'createdAt' | 'updatedAt' | 'clientName' | 'projectName'
>;

function getInvoiceSortValue(invoice: Invoice, key: string): unknown {
  return invoice[key as keyof Invoice];
}

export const fakeInvoices = {
  records: [] as Invoice[],

  serializeInvoice(invoice: Invoice): Invoice {
    const client = fakeClients.records.find((item) => item.id === invoice.clientId);
    const project = invoice.projectId
      ? fakeProjects.records.find((item) => item.id === invoice.projectId)
      : null;

    return {
      ...invoice,
      clientName: client?.company ?? client?.name ?? 'Unknown Client',
      projectName: project?.name ?? null
    };
  },

  initialize() {
    const statuses: InvoiceStatus[] = ['DRAFT', 'SENT', 'PAID', 'PARTIAL', 'OVERDUE', 'CANCELLED'];
    const sampleInvoices: Invoice[] = [];
    const clientsLength = Math.max(fakeClients.records.length, 1);
    const projectsLength = fakeProjects.records.length;

    for (let i = 1; i <= 32; i++) {
      const status = faker.helpers.arrayElement(statuses);
      const paidAt =
        status === 'PAID' || status === 'PARTIAL'
          ? faker.date.recent({ days: 20 }).toISOString()
          : null;

      sampleInvoices.push({
        id: i,
        number: `INV-2026-${String(i).padStart(3, '0')}`,
        clientId: faker.number.int({ min: 1, max: clientsLength }),
        clientName: '',
        projectId:
          projectsLength > 0
            ? (faker.helpers.maybe(() => faker.number.int({ min: 1, max: projectsLength }), {
                probability: 0.7
              }) ?? null)
            : null,
        projectName: null,
        status,
        total: faker.number.int({ min: 1_500_000, max: 48_000_000 }),
        dueDate:
          faker.helpers.maybe(() => faker.date.soon({ days: 30 }).toISOString(), {
            probability: 0.9
          }) ?? null,
        paidAt,
        notes: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.3 }) ?? null,
        createdAt: faker.date.between({ from: '2025-08-01', to: '2026-04-20' }).toISOString(),
        updatedAt: faker.date.recent({ days: 20 }).toISOString()
      });
    }

    this.records = sampleInvoices.map((invoice) => this.serializeInvoice(invoice));
  },

  async getAll({ search, status }: { search?: string; status?: string }): Promise<Invoice[]> {
    let invoices = [...this.records];

    if (status) {
      const statusList = status.split(',').map((item) => item.trim().toUpperCase());
      invoices = invoices.filter((invoice) => statusList.includes(invoice.status));
    }

    if (search) {
      invoices = matchSorter(invoices, search, {
        keys: ['number', 'clientName', 'projectName']
      });
    }

    return invoices.map((invoice) => this.serializeInvoice(invoice));
  },

  async getInvoices({
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
  }): Promise<{ items: Invoice[]; total_items: number }> {
    await delay(800);

    const allInvoices = await this.getAll({ search, status });

    if (sort) {
      try {
        const sortItems = JSON.parse(sort) as { id: string; desc: boolean }[];

        if (sortItems.length > 0) {
          const { id, desc } = sortItems[0];
          allInvoices.sort((a, b) => {
            const aVal = getInvoiceSortValue(a, id) ?? '';
            const bVal = getInvoiceSortValue(b, id) ?? '';

            if (typeof aVal === 'number' && typeof bVal === 'number') {
              return desc ? bVal - aVal : aVal - bVal;
            }

            return desc
              ? String(bVal).localeCompare(String(aVal))
              : String(aVal).localeCompare(String(bVal));
          });
        }
      } catch {
        // ignore invalid sort payload
      }
    }

    const total_items = allInvoices.length;
    const offset = (page - 1) * limit;
    const items = allInvoices.slice(offset, offset + limit);

    return { items, total_items };
  },

  async getInvoiceById(id: number): Promise<Invoice | null> {
    await delay(500);
    const invoice = this.records.find((item) => item.id === id);
    return invoice ? this.serializeInvoice(invoice) : null;
  },

  async createInvoice(data: InvoiceWriteInput): Promise<Invoice> {
    await delay(800);

    const newInvoice: Invoice = {
      ...data,
      id: Math.max(0, ...this.records.map((item) => item.id)) + 1,
      clientName: '',
      projectName: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const serializedInvoice = this.serializeInvoice(newInvoice);
    this.records.unshift(serializedInvoice);

    return serializedInvoice;
  },

  async updateInvoice(id: number, data: Partial<InvoiceWriteInput>): Promise<Invoice> {
    await delay(800);

    const index = this.records.findIndex((item) => item.id === id);
    if (index === -1) throw new Error(`Invoice with ID ${id} not found`);

    this.records[index] = this.serializeInvoice({
      ...this.records[index],
      ...data,
      updatedAt: new Date().toISOString()
    });

    return this.records[index];
  },

  async deleteInvoice(id: number): Promise<void> {
    await delay(800);

    const index = this.records.findIndex((item) => item.id === id);
    if (index === -1) throw new Error(`Invoice with ID ${id} not found`);

    this.records.splice(index, 1);
  }
};

fakeInvoices.initialize();
