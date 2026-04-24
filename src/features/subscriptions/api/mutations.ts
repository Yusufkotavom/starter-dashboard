import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import {
  createClientSubscription,
  createSubscriptionPlan,
  deleteClientSubscription,
  deleteSubscriptionPlan,
  updateClientSubscription,
  updateSubscriptionPlan
} from './service';
import { clientSubscriptionKeys, subscriptionPlanKeys } from './queries';
import type { ClientSubscriptionMutationPayload, SubscriptionPlanMutationPayload } from './types';

export const createSubscriptionPlanMutation = mutationOptions({
  mutationFn: (data: SubscriptionPlanMutationPayload) => createSubscriptionPlan(data),
  onSuccess: () => getQueryClient().invalidateQueries({ queryKey: subscriptionPlanKeys.all })
});

export const updateSubscriptionPlanMutation = mutationOptions({
  mutationFn: ({ id, values }: { id: number; values: SubscriptionPlanMutationPayload }) =>
    updateSubscriptionPlan(id, values),
  onSuccess: () => getQueryClient().invalidateQueries({ queryKey: subscriptionPlanKeys.all })
});

export const deleteSubscriptionPlanMutation = mutationOptions({
  mutationFn: (id: number) => deleteSubscriptionPlan(id),
  onSuccess: () => getQueryClient().invalidateQueries({ queryKey: subscriptionPlanKeys.all })
});

export const createClientSubscriptionMutation = mutationOptions({
  mutationFn: (data: ClientSubscriptionMutationPayload) => createClientSubscription(data),
  onSuccess: () => getQueryClient().invalidateQueries({ queryKey: clientSubscriptionKeys.all })
});

export const updateClientSubscriptionMutation = mutationOptions({
  mutationFn: ({ id, values }: { id: number; values: ClientSubscriptionMutationPayload }) =>
    updateClientSubscription(id, values),
  onSuccess: () => getQueryClient().invalidateQueries({ queryKey: clientSubscriptionKeys.all })
});

export const deleteClientSubscriptionMutation = mutationOptions({
  mutationFn: (id: number) => deleteClientSubscription(id),
  onSuccess: () => getQueryClient().invalidateQueries({ queryKey: clientSubscriptionKeys.all })
});
