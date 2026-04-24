import type { SubscriptionInterval } from '@/features/subscriptions/api/types';

export interface ProductPlan {
  id?: number;
  name: string;
  description?: string | null;
  interval: SubscriptionInterval;
  price: number;
  isActive: boolean;
  activeSubscriptions?: number;
}

export interface Product {
  id: number;
  photo_url: string;
  name: string;
  description: string;
  created_at: string;
  price: number;
  category: string;
  categoryName: string;
  type: 'product' | 'service';
  isDigital: boolean;
  deliveryUrl: string | null;
  subscriptionPlans: ProductPlan[];
  activePlanCount: number;
  updated_at: string;
}

export interface ProductFilters {
  page?: number;
  limit?: number;
  categories?: string;
  search?: string;
  sort?: string;
}

export interface ProductsResponse {
  success: boolean;
  time: string;
  message: string;
  total_products: number;
  offset: number;
  limit: number;
  products: Product[];
}

export interface ProductByIdResponse {
  success: boolean;
  time: string;
  message: string;
  product: Product;
}

export interface ProductMutationPayload {
  name: string;
  category: string;
  type: 'product' | 'service';
  isDigital?: boolean;
  deliveryUrl?: string | null;
  price: number;
  description: string;
  photoUrl?: string | null;
  recurringPlans?: ProductPlan[];
}
