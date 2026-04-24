import { queryOptions } from '@tanstack/react-query';
import { getCategories, getCategoryById } from './service';
import type { Category, CategoryFilters } from './types';

export type { Category };

export const categoryKeys = {
  all: ['categories'] as const,
  list: (filters: CategoryFilters) => [...categoryKeys.all, 'list', filters] as const,
  detail: (id: number) => [...categoryKeys.all, 'detail', id] as const
};

export const categoriesQueryOptions = (filters: CategoryFilters) =>
  queryOptions({
    queryKey: categoryKeys.list(filters),
    queryFn: () => getCategories(filters)
  });

export const categoryByIdOptions = (id: number) =>
  queryOptions({
    queryKey: categoryKeys.detail(id),
    queryFn: () => getCategoryById(id)
  });
