import { apiClient } from '@/lib/api-client';
import type { Expense, ExpenseFilters, ExpensesResponse, ExpenseMutationPayload } from './types';

function createExpenseQueryString(filters: ExpenseFilters): string {
  const searchParams = new URLSearchParams();

  if (filters.page) searchParams.set('page', String(filters.page));
  if (filters.limit) searchParams.set('limit', String(filters.limit));
  if (filters.search) searchParams.set('search', filters.search);
  if (filters.sort) searchParams.set('sort', filters.sort);

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

export async function getExpenses(filters: ExpenseFilters): Promise<ExpensesResponse> {
  return apiClient<ExpensesResponse>(`/expenses${createExpenseQueryString(filters)}`);
}

export async function getExpenseById(id: number): Promise<Expense | null> {
  return apiClient<Expense>(`/expenses/${id}`);
}

export async function createExpense(data: ExpenseMutationPayload): Promise<Expense> {
  return apiClient<Expense>('/expenses', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function updateExpense(id: number, data: ExpenseMutationPayload): Promise<Expense> {
  return apiClient<Expense>(`/expenses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

export async function deleteExpense(id: number): Promise<void> {
  await apiClient(`/expenses/${id}`, {
    method: 'DELETE'
  });
}
