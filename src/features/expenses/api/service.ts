import { fakeExpenses } from '@/constants/mock-api-expenses';
import type { Expense, ExpenseFilters, ExpensesResponse, ExpenseMutationPayload } from './types';

export async function getExpenses(filters: ExpenseFilters): Promise<ExpensesResponse> {
  return fakeExpenses.getExpenses(filters);
}

export async function getExpenseById(id: number): Promise<Expense | null> {
  return fakeExpenses.getExpenseById(id);
}

export async function createExpense(data: ExpenseMutationPayload): Promise<Expense> {
  return fakeExpenses.createExpense({
    projectId: data.projectId ?? null,
    category: data.category,
    vendor: data.vendor ?? null,
    amount: data.amount,
    date: data.date,
    notes: data.notes ?? null
  });
}

export async function updateExpense(id: number, data: ExpenseMutationPayload): Promise<Expense> {
  return fakeExpenses.updateExpense(id, {
    projectId: data.projectId ?? null,
    category: data.category,
    vendor: data.vendor ?? null,
    amount: data.amount,
    date: data.date,
    notes: data.notes ?? null
  });
}

export async function deleteExpense(id: number): Promise<void> {
  return fakeExpenses.deleteExpense(id);
}
