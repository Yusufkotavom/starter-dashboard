import { apiClient } from '@/lib/api-client';
import type {
  CategoryFilters,
  CategoriesResponse,
  CategoryByIdResponse,
  CategoryMutationPayload
} from './types';

function createCategoryQueryString(filters: CategoryFilters): string {
  const searchParams = new URLSearchParams();

  if (filters.page) searchParams.set('page', String(filters.page));
  if (filters.limit) searchParams.set('limit', String(filters.limit));
  if (filters.search) searchParams.set('search', filters.search);
  if (filters.sort) searchParams.set('sort', filters.sort);

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

export async function getCategories(filters: CategoryFilters): Promise<CategoriesResponse> {
  return apiClient<CategoriesResponse>(`/categories${createCategoryQueryString(filters)}`);
}

export async function getCategoryById(id: number): Promise<CategoryByIdResponse> {
  return apiClient<CategoryByIdResponse>(`/categories/${id}`);
}

export async function createCategory(data: CategoryMutationPayload) {
  return apiClient('/categories', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function updateCategory(id: number, data: CategoryMutationPayload) {
  return apiClient(`/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

export async function deleteCategory(id: number) {
  return apiClient(`/categories/${id}`, {
    method: 'DELETE'
  });
}
