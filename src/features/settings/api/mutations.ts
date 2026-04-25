import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { connectWhatsAppSession, updateSettings } from './service';
import { settingsKeys } from './queries';
import type { AppSettingsMutationPayload } from './types';

export const updateSettingsMutation = mutationOptions({
  mutationFn: (values: AppSettingsMutationPayload) => updateSettings(values),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: settingsKeys.all });
    getQueryClient().invalidateQueries({ queryKey: settingsKeys.whatsappStatus() });
  }
});

export const connectWhatsAppSessionMutation = mutationOptions({
  mutationFn: () => connectWhatsAppSession(),
  onSuccess: () => getQueryClient().invalidateQueries({ queryKey: settingsKeys.whatsappStatus() })
});
