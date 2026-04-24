import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { createClient, updateClient, deleteClient } from './service';
import { clientKeys } from './queries';
import type { ClientMutationPayload } from './types';

export const createClientMutation = mutationOptions({
  mutationFn: (data: ClientMutationPayload) => createClient(data),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: clientKeys.all });
  }
});

export const updateClientMutation = mutationOptions({
  mutationFn: ({ id, values }: { id: number; values: ClientMutationPayload }) =>
    updateClient(id, values),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: clientKeys.all });
  }
});

export const deleteClientMutation = mutationOptions({
  mutationFn: (id: number) => deleteClient(id),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: clientKeys.all });
  }
});
