import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { createExpense, deleteExpense, updateExpense } from './service';
import { expenseKeys } from './queries';
import type { ExpenseMutationPayload } from './types';

export const createExpenseMutation = mutationOptions({
  mutationFn: (data: ExpenseMutationPayload) => createExpense(data),
  onSuccess: () => getQueryClient().invalidateQueries({ queryKey: expenseKeys.all })
});

export const updateExpenseMutation = mutationOptions({
  mutationFn: ({ id, values }: { id: number; values: ExpenseMutationPayload }) =>
    updateExpense(id, values),
  onSuccess: () => getQueryClient().invalidateQueries({ queryKey: expenseKeys.all })
});

export const deleteExpenseMutation = mutationOptions({
  mutationFn: (id: number) => deleteExpense(id),
  onSuccess: () => getQueryClient().invalidateQueries({ queryKey: expenseKeys.all })
});
