////////////////////////////////////////////////////////////////////////////////
// Demo quotation store for agency workflow
////////////////////////////////////////////////////////////////////////////////

import { faker } from '@faker-js/faker';
import { matchSorter } from 'match-sorter';
import { delay } from './mock-api';
import { fakeClients } from './mock-api-clients';

export type QuotationStatus = 'DRAFT' | 'SENT' | 'APPROVED' | 'REJECTED' | 'EXPIRED';

export interface Quotation {
  id: number;
  number: string;
  clientId: number;
  clientName: string;
  clientCompany: string | null;
  status: QuotationStatus;
  total: number;
  validUntil: string | null;
  notes: string | null;
  itemsCount: number;
  createdAt: string;
  updatedAt: string;
}

type QuotationWriteInput = Omit<
  Quotation,
  'id' | 'createdAt' | 'updatedAt' | 'clientName' | 'clientCompany'
>;

function getQuotationSortValue(quotation: Quotation, key: string): unknown {
  return quotation[key as keyof Quotation];
}

export const fakeQuotations = {
  records: [] as Quotation[],

  serializeQuotation(quotation: Quotation): Quotation {
    const client = fakeClients.records.find((item) => item.id === quotation.clientId);

    return {
      ...quotation,
      clientName: client?.name ?? 'Unknown Client',
      clientCompany: client?.company ?? null
    };
  },

  initialize() {
    const statuses: QuotationStatus[] = ['DRAFT', 'SENT', 'APPROVED', 'REJECTED', 'EXPIRED'];
    const sampleQuotations: Quotation[] = [];
    const clientsLength = Math.max(fakeClients.records.length, 1);

    for (let i = 1; i <= 36; i++) {
      sampleQuotations.push({
        id: i,
        number: `QUO-2026-${String(i).padStart(3, '0')}`,
        clientId: faker.number.int({ min: 1, max: clientsLength }),
        clientName: '',
        clientCompany: null,
        status: faker.helpers.arrayElement(statuses),
        total: faker.number.int({ min: 2_500_000, max: 65_000_000 }),
        validUntil:
          faker.helpers.maybe(() => faker.date.soon({ days: 45 }).toISOString(), {
            probability: 0.8
          }) ?? null,
        notes: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.35 }) ?? null,
        itemsCount: faker.number.int({ min: 1, max: 5 }),
        createdAt: faker.date.between({ from: '2025-01-01', to: '2026-04-20' }).toISOString(),
        updatedAt: faker.date.recent({ days: 40 }).toISOString()
      });
    }

    this.records = sampleQuotations.map((quotation) => this.serializeQuotation(quotation));
  },

  async getAll({ search, status }: { search?: string; status?: string }): Promise<Quotation[]> {
    let quotations = [...this.records];

    if (status) {
      const statusList = status.split(',').map((item) => item.trim().toUpperCase());
      quotations = quotations.filter((quotation) => statusList.includes(quotation.status));
    }

    if (search) {
      quotations = matchSorter(quotations, search, {
        keys: ['number', 'clientName', 'clientCompany']
      });
    }

    return quotations.map((quotation) => this.serializeQuotation(quotation));
  },

  async getQuotations({
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
  }): Promise<{ items: Quotation[]; total_items: number }> {
    await delay(800);

    const allQuotations = await this.getAll({ search, status });

    if (sort) {
      try {
        const sortItems = JSON.parse(sort) as { id: string; desc: boolean }[];

        if (sortItems.length > 0) {
          const { id, desc } = sortItems[0];
          allQuotations.sort((a, b) => {
            const aVal = getQuotationSortValue(a, id) ?? '';
            const bVal = getQuotationSortValue(b, id) ?? '';

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

    const total_items = allQuotations.length;
    const offset = (page - 1) * limit;
    const items = allQuotations.slice(offset, offset + limit);

    return { items, total_items };
  },

  async getQuotationById(id: number): Promise<Quotation | null> {
    await delay(500);
    const quotation = this.records.find((item) => item.id === id);
    return quotation ? this.serializeQuotation(quotation) : null;
  },

  async createQuotation(data: QuotationWriteInput): Promise<Quotation> {
    await delay(800);

    const newQuotation: Quotation = {
      ...data,
      id: Math.max(0, ...this.records.map((item) => item.id)) + 1,
      clientName: '',
      clientCompany: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const serializedQuotation = this.serializeQuotation(newQuotation);
    this.records.unshift(serializedQuotation);

    return serializedQuotation;
  },

  async updateQuotation(id: number, data: Partial<QuotationWriteInput>): Promise<Quotation> {
    await delay(800);

    const index = this.records.findIndex((item) => item.id === id);
    if (index === -1) throw new Error(`Quotation with ID ${id} not found`);

    this.records[index] = this.serializeQuotation({
      ...this.records[index],
      ...data,
      updatedAt: new Date().toISOString()
    });

    return this.records[index];
  },

  async deleteQuotation(id: number): Promise<void> {
    await delay(800);

    const index = this.records.findIndex((item) => item.id === id);
    if (index === -1) throw new Error(`Quotation with ID ${id} not found`);

    this.records.splice(index, 1);
  }
};

fakeQuotations.initialize();
