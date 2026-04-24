import { apiClient } from '@/lib/api-client';
import type {
  ProductFilters,
  ProductsResponse,
  ProductByIdResponse,
  ProductMutationPayload
} from './types';

function createProductQueryString(filters: ProductFilters): string {
  const searchParams = new URLSearchParams();

  if (filters.page) searchParams.set('page', String(filters.page));
  if (filters.limit) searchParams.set('limit', String(filters.limit));
  if (filters.categories) searchParams.set('categories', filters.categories);
  if (filters.search) searchParams.set('search', filters.search);
  if (filters.sort) searchParams.set('sort', filters.sort);

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

export async function getProducts(filters: ProductFilters): Promise<ProductsResponse> {
  return apiClient<ProductsResponse>(`/products${createProductQueryString(filters)}`);
}

export async function getProductById(id: number): Promise<ProductByIdResponse> {
  return apiClient<ProductByIdResponse>(`/products/${id}`);
}

export async function createProduct(data: ProductMutationPayload) {
  return apiClient('/products', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function updateProduct(id: number, data: ProductMutationPayload) {
  return apiClient(`/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

export async function deleteProduct(id: number) {
  return apiClient(`/products/${id}`, {
    method: 'DELETE'
  });
}
