import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { attachCommunicationClient, sendCommunicationMessage } from './service';
import { communicationKeys } from './queries';
import type { AttachClientPayload, SendCommunicationMessagePayload } from './types';

export const attachCommunicationClientMutation = mutationOptions({
  mutationFn: ({ id, values }: { id: number | string; values: AttachClientPayload }) =>
    attachCommunicationClient(id, values),
  onSuccess: (_, variables) => {
    getQueryClient().invalidateQueries({ queryKey: communicationKeys.all });
    getQueryClient().invalidateQueries({ queryKey: communicationKeys.detail(variables.id) });
  }
});

export const sendCommunicationMessageMutation = mutationOptions({
  mutationFn: ({ id, values }: { id: number | string; values: SendCommunicationMessagePayload }) =>
    sendCommunicationMessage(id, values),
  onSuccess: (_, variables) => {
    getQueryClient().invalidateQueries({ queryKey: communicationKeys.all });
    getQueryClient().invalidateQueries({ queryKey: communicationKeys.detail(variables.id) });
  }
});
