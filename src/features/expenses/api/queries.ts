import { queryOptions } from '@tanstack/react-query';
import { getExpenseById, getExpenses } from './service';
import type { Expense, ExpenseFilters } from './types';

export type { Expense };

export const expenseKeys = {
  all: ['expenses'] as const,
  list: (filters: ExpenseFilters) => [...expenseKeys.all, 'list', filters] as const,
  detail: (id: number) => [...expenseKeys.all, 'detail', id] as const
};

export const expensesQueryOptions = (filters: ExpenseFilters) =>
  queryOptions({
    queryKey: expenseKeys.list(filters),
    queryFn: () => getExpenses(filters)
  });

export const expenseByIdOptions = (id: number) =>
  queryOptions({
    queryKey: expenseKeys.detail(id),
    queryFn: () => getExpenseById(id)
  });
