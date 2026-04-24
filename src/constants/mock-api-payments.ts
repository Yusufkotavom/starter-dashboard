////////////////////////////////////////////////////////////////////////////////
// Demo payment store for agency workflow
////////////////////////////////////////////////////////////////////////////////

import { faker } from '@faker-js/faker';
import { matchSorter } from 'match-sorter';
import { delay } from './mock-api';
import { fakeInvoices } from './mock-api-invoices';

export type PaymentMethod = 'BANK_TRANSFER' | 'QRIS' | 'CASH' | 'CARD';

export interface Payment {
  id: number;
  invoiceId: number;
  invoiceNumber: string;
  clientName: string;
  amount: number;
  method: PaymentMethod;
  reference: string | null;
  paidAt: string;
  notes: string | null;
  createdAt: string;
}

type PaymentWriteInput = Omit<Payment, 'id' | 'createdAt' | 'invoiceNumber' | 'clientName'>;

function getPaymentSortValue(payment: Payment, key: string): unknown {
  return payment[key as keyof Payment];
}

export const fakePayments = {
  records: [] as Payment[],

  serializePayment(payment: Payment): Payment {
    const invoice = fakeInvoices.records.find((item) => item.id === payment.invoiceId);

    return {
      ...payment,
      invoiceNumber: invoice?.number ?? 'Unknown Invoice',
      clientName: invoice?.clientName ?? 'Unknown Client'
    };
  },

  initialize() {
    const methods: PaymentMethod[] = ['BANK_TRANSFER', 'QRIS', 'CASH', 'CARD'];
    const samplePayments: Payment[] = [];
    const invoicesLength = Math.max(fakeInvoices.records.length, 1);

    for (let i = 1; i <= 28; i++) {
      samplePayments.push({
        id: i,
        invoiceId: faker.number.int({ min: 1, max: invoicesLength }),
        invoiceNumber: '',
        clientName: '',
        amount: faker.number.int({ min: 500_000, max: 18_000_000 }),
        method: faker.helpers.arrayElement(methods),
        reference:
          faker.helpers.maybe(() => `PAY-${faker.string.alphanumeric(8).toUpperCase()}`, {
            probability: 0.75
          }) ?? null,
        paidAt: faker.date.recent({ days: 45 }).toISOString(),
        notes: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.25 }) ?? null,
        createdAt: faker.date.recent({ days: 45 }).toISOString()
      });
    }

    this.records = samplePayments.map((payment) => this.serializePayment(payment));
  },

  async getAll({ search }: { search?: string }): Promise<Payment[]> {
    let payments = [...this.records];

    if (search) {
      payments = matchSorter(payments, search, {
        keys: ['invoiceNumber', 'clientName', 'reference', 'method']
      });
    }

    return payments.map((payment) => this.serializePayment(payment));
  },

  async getPayments({
    page = 1,
    limit = 10,
    search,
    sort
  }: {
    page?: number;
    limit?: number;
    search?: string;
    sort?: string;
  }): Promise<{ items: Payment[]; total_items: number }> {
    await delay(800);

    const allPayments = await this.getAll({ search });

    if (sort) {
      try {
        const sortItems = JSON.parse(sort) as { id: string; desc: boolean }[];

        if (sortItems.length > 0) {
          const { id, desc } = sortItems[0];
          allPayments.sort((a, b) => {
            const aVal = getPaymentSortValue(a, id) ?? '';
            const bVal = getPaymentSortValue(b, id) ?? '';

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

    const total_items = allPayments.length;
    const offset = (page - 1) * limit;
    const items = allPayments.slice(offset, offset + limit);

    return { items, total_items };
  },

  async getPaymentById(id: number): Promise<Payment | null> {
    await delay(500);
    const payment = this.records.find((item) => item.id === id);
    return payment ? this.serializePayment(payment) : null;
  },

  async createPayment(data: PaymentWriteInput): Promise<Payment> {
    await delay(800);

    const newPayment: Payment = {
      ...data,
      id: Math.max(0, ...this.records.map((item) => item.id)) + 1,
      invoiceNumber: '',
      clientName: '',
      createdAt: new Date().toISOString()
    };

    const serializedPayment = this.serializePayment(newPayment);
    this.records.unshift(serializedPayment);

    return serializedPayment;
  },

  async updatePayment(id: number, data: Partial<PaymentWriteInput>): Promise<Payment> {
    await delay(800);

    const index = this.records.findIndex((item) => item.id === id);
    if (index === -1) throw new Error(`Payment with ID ${id} not found`);

    this.records[index] = this.serializePayment({
      ...this.records[index],
      ...data
    });

    return this.records[index];
  },

  async deletePayment(id: number): Promise<void> {
    await delay(800);

    const index = this.records.findIndex((item) => item.id === id);
    if (index === -1) throw new Error(`Payment with ID ${id} not found`);

    this.records.splice(index, 1);
  }
};

fakePayments.initialize();
