////////////////////////////////////////////////////////////////////////////////
// Demo expense store for agency workflow
////////////////////////////////////////////////////////////////////////////////

import { faker } from '@faker-js/faker';
import { matchSorter } from 'match-sorter';
import { delay } from './mock-api';
import { fakeProjects } from './mock-api-projects';

export interface Expense {
  id: number;
  projectId: number | null;
  projectName: string | null;
  category: string;
  vendor: string | null;
  amount: number;
  date: string;
  notes: string | null;
  createdAt: string;
}

type ExpenseWriteInput = Omit<Expense, 'id' | 'createdAt' | 'projectName'>;

function getExpenseSortValue(expense: Expense, key: string): unknown {
  return expense[key as keyof Expense];
}

const expenseCategories = ['Vendor', 'Freelancer', 'Tools', 'Hosting', 'Ads', 'Operational'];

export const fakeExpenses = {
  records: [] as Expense[],

  serializeExpense(expense: Expense): Expense {
    const project = expense.projectId
      ? fakeProjects.records.find((item) => item.id === expense.projectId)
      : null;

    return {
      ...expense,
      projectName: project?.name ?? null
    };
  },

  initialize() {
    const sampleExpenses: Expense[] = [];
    const projectsLength = fakeProjects.records.length;

    for (let i = 1; i <= 30; i++) {
      sampleExpenses.push({
        id: i,
        projectId:
          projectsLength > 0
            ? (faker.helpers.maybe(() => faker.number.int({ min: 1, max: projectsLength }), {
                probability: 0.75
              }) ?? null)
            : null,
        projectName: null,
        category: faker.helpers.arrayElement(expenseCategories),
        vendor: faker.helpers.maybe(() => faker.company.name(), { probability: 0.6 }) ?? null,
        amount: faker.number.int({ min: 150_000, max: 9_500_000 }),
        date: faker.date.recent({ days: 60 }).toISOString(),
        notes: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.25 }) ?? null,
        createdAt: faker.date.recent({ days: 60 }).toISOString()
      });
    }

    this.records = sampleExpenses.map((expense) => this.serializeExpense(expense));
  },

  async getAll({ search }: { search?: string }): Promise<Expense[]> {
    let expenses = [...this.records];

    if (search) {
      expenses = matchSorter(expenses, search, {
        keys: ['category', 'vendor', 'projectName']
      });
    }

    return expenses.map((expense) => this.serializeExpense(expense));
  },

  async getExpenses({
    page = 1,
    limit = 10,
    search,
    sort
  }: {
    page?: number;
    limit?: number;
    search?: string;
    sort?: string;
  }): Promise<{ items: Expense[]; total_items: number }> {
    await delay(800);

    const allExpenses = await this.getAll({ search });

    if (sort) {
      try {
        const sortItems = JSON.parse(sort) as { id: string; desc: boolean }[];

        if (sortItems.length > 0) {
          const { id, desc } = sortItems[0];
          allExpenses.sort((a, b) => {
            const aVal = getExpenseSortValue(a, id) ?? '';
            const bVal = getExpenseSortValue(b, id) ?? '';

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

    const total_items = allExpenses.length;
    const offset = (page - 1) * limit;
    const items = allExpenses.slice(offset, offset + limit);

    return { items, total_items };
  },

  async getExpenseById(id: number): Promise<Expense | null> {
    await delay(500);
    const expense = this.records.find((item) => item.id === id);
    return expense ? this.serializeExpense(expense) : null;
  },

  async createExpense(data: ExpenseWriteInput): Promise<Expense> {
    await delay(800);

    const newExpense: Expense = {
      ...data,
      id: Math.max(0, ...this.records.map((item) => item.id)) + 1,
      projectName: null,
      createdAt: new Date().toISOString()
    };

    const serializedExpense = this.serializeExpense(newExpense);
    this.records.unshift(serializedExpense);

    return serializedExpense;
  },

  async updateExpense(id: number, data: Partial<ExpenseWriteInput>): Promise<Expense> {
    await delay(800);

    const index = this.records.findIndex((item) => item.id === id);
    if (index === -1) throw new Error(`Expense with ID ${id} not found`);

    this.records[index] = this.serializeExpense({
      ...this.records[index],
      ...data
    });

    return this.records[index];
  },

  async deleteExpense(id: number): Promise<void> {
    await delay(800);

    const index = this.records.findIndex((item) => item.id === id);
    if (index === -1) throw new Error(`Expense with ID ${id} not found`);

    this.records.splice(index, 1);
  }
};

fakeExpenses.initialize();
