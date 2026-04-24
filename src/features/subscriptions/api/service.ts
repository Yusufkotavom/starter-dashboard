import { apiClient } from '@/lib/api-client';
import type {
  ClientSubscription,
  ClientSubscriptionFilters,
  ClientSubscriptionMutationPayload,
  ClientSubscriptionsResponse,
  SubscriptionPlan,
  SubscriptionPlanFilters,
  SubscriptionPlanMutationPayload,
  SubscriptionPlansResponse
} from './types';

function createQueryString(filters: Record<string, string | number | undefined>): string {
  const searchParams = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      searchParams.set(key, String(value));
    }
  });

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

export async function getSubscriptionPlans(
  filters: SubscriptionPlanFilters
): Promise<SubscriptionPlansResponse> {
  return apiClient<SubscriptionPlansResponse>(
    `/subscriptions/plans${createQueryString({
      page: filters.page,
      limit: filters.limit,
      search: filters.search,
      interval: filters.interval,
      isActive: filters.isActive
    })}`
  );
}

export async function getSubscriptionPlanById(id: number): Promise<SubscriptionPlan | null> {
  return apiClient<SubscriptionPlan>(`/subscriptions/plans/${id}`);
}

export async function createSubscriptionPlan(
  data: SubscriptionPlanMutationPayload
): Promise<SubscriptionPlan> {
  return apiClient<SubscriptionPlan>('/subscriptions/plans', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function updateSubscriptionPlan(
  id: number,
  data: SubscriptionPlanMutationPayload
): Promise<SubscriptionPlan> {
  return apiClient<SubscriptionPlan>(`/subscriptions/plans/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

export async function deleteSubscriptionPlan(id: number): Promise<void> {
  await apiClient(`/subscriptions/plans/${id}`, {
    method: 'DELETE'
  });
}

export async function getClientSubscriptions(
  filters: ClientSubscriptionFilters
): Promise<ClientSubscriptionsResponse> {
  return apiClient<ClientSubscriptionsResponse>(
    `/subscriptions/client-subscriptions${createQueryString({
      page: filters.page,
      limit: filters.limit,
      search: filters.search,
      status: filters.status,
      planId: filters.planId,
      clientId: filters.clientId
    })}`
  );
}

export async function getClientSubscriptionById(id: number): Promise<ClientSubscription | null> {
  return apiClient<ClientSubscription>(`/subscriptions/client-subscriptions/${id}`);
}

export async function createClientSubscription(
  data: ClientSubscriptionMutationPayload
): Promise<ClientSubscription> {
  return apiClient<ClientSubscription>('/subscriptions/client-subscriptions', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function updateClientSubscription(
  id: number,
  data: ClientSubscriptionMutationPayload
): Promise<ClientSubscription> {
  return apiClient<ClientSubscription>(`/subscriptions/client-subscriptions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

export async function deleteClientSubscription(id: number): Promise<void> {
  await apiClient(`/subscriptions/client-subscriptions/${id}`, {
    method: 'DELETE'
  });
}
