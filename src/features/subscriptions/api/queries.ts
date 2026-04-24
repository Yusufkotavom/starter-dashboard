import { queryOptions } from '@tanstack/react-query';
import {
  getClientSubscriptionById,
  getClientSubscriptions,
  getSubscriptionPlanById,
  getSubscriptionPlans
} from './service';
import type {
  ClientSubscription,
  ClientSubscriptionFilters,
  SubscriptionPlan,
  SubscriptionPlanFilters
} from './types';

export type { ClientSubscription, SubscriptionPlan };

export const subscriptionPlanKeys = {
  all: ['subscription-plans'] as const,
  list: (filters: SubscriptionPlanFilters) =>
    [...subscriptionPlanKeys.all, 'list', filters] as const,
  detail: (id: number) => [...subscriptionPlanKeys.all, 'detail', id] as const
};

export const clientSubscriptionKeys = {
  all: ['client-subscriptions'] as const,
  list: (filters: ClientSubscriptionFilters) =>
    [...clientSubscriptionKeys.all, 'list', filters] as const,
  detail: (id: number) => [...clientSubscriptionKeys.all, 'detail', id] as const
};

export const subscriptionPlansQueryOptions = (filters: SubscriptionPlanFilters) =>
  queryOptions({
    queryKey: subscriptionPlanKeys.list(filters),
    queryFn: () => getSubscriptionPlans(filters)
  });

export const subscriptionPlanByIdOptions = (id: number) =>
  queryOptions({
    queryKey: subscriptionPlanKeys.detail(id),
    queryFn: () => getSubscriptionPlanById(id)
  });

export const clientSubscriptionsQueryOptions = (filters: ClientSubscriptionFilters) =>
  queryOptions({
    queryKey: clientSubscriptionKeys.list(filters),
    queryFn: () => getClientSubscriptions(filters)
  });

export const clientSubscriptionByIdOptions = (id: number) =>
  queryOptions({
    queryKey: clientSubscriptionKeys.detail(id),
    queryFn: () => getClientSubscriptionById(id)
  });
