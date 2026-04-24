export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  productCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryFilters {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
}

export interface CategoriesResponse {
  success: boolean;
  time: string;
  message: string;
  total_categories: number;
  offset: number;
  limit: number;
  categories: Category[];
}

export interface CategoryByIdResponse {
  success: boolean;
  time: string;
  message: string;
  category: Category;
}

export interface CategoryMutationPayload {
  name: string;
  slug: string;
  description: string;
}
