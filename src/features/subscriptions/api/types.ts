export type SubscriptionInterval =
  | 'ONE_TIME'
  | 'LIFETIME'
  | 'WEEKLY'
  | 'MONTHLY'
  | 'QUARTERLY'
  | 'YEARLY';
export type SubscriptionStatus = 'ACTIVE' | 'PAUSED' | 'CANCELLED' | 'EXPIRED';

export interface SubscriptionPlan {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  serviceId: number | null;
  serviceName: string | null;
  price: number;
  interval: SubscriptionInterval;
  isActive: boolean;
  activeSubscriptions: number;
  createdAt: string;
  updatedAt: string;
}

export interface ClientSubscription {
  id: number;
  clientId: number;
  clientName: string;
  clientCompany: string | null;
  planId: number;
  planName: string;
  planInterval: SubscriptionInterval;
  projectId: number | null;
  projectName: string | null;
  status: SubscriptionStatus;
  startDate: string;
  nextBillingDate: string | null;
  endDate: string | null;
  autoRenew: boolean;
  priceOverride: number | null;
  effectivePrice: number;
  notes: string | null;
  invoiceCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionPlanFilters {
  page?: number;
  limit?: number;
  search?: string;
  interval?: string;
  isActive?: string;
}

export interface ClientSubscriptionFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  planId?: number;
  clientId?: number;
}

export interface SubscriptionPlansResponse {
  items: SubscriptionPlan[];
  total_items: number;
}

export interface ClientSubscriptionsResponse {
  items: ClientSubscription[];
  total_items: number;
}

export interface SubscriptionPlanMutationPayload {
  name: string;
  slug: string;
  description?: string | null;
  serviceId?: number | null;
  price: number;
  interval: SubscriptionInterval;
  isActive: boolean;
}

export interface ClientSubscriptionMutationPayload {
  clientId: number;
  planId: number;
  projectId?: number | null;
  status: SubscriptionStatus;
  startDate: string;
  nextBillingDate?: string | null;
  endDate?: string | null;
  autoRenew: boolean;
  priceOverride?: number | null;
  notes?: string | null;
}
