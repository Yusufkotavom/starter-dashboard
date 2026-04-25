import { queryOptions } from '@tanstack/react-query';
import { getSettings, getWhatsAppSetupStatus } from './service';

export const settingsKeys = {
  all: ['settings'] as const,
  whatsappStatus: () => [...settingsKeys.all, 'whatsapp-status'] as const
};

export const settingsQueryOptions = () =>
  queryOptions({
    queryKey: settingsKeys.all,
    queryFn: getSettings
  });

export const whatsappSetupStatusQueryOptions = () =>
  queryOptions({
    queryKey: settingsKeys.whatsappStatus(),
    queryFn: getWhatsAppSetupStatus
  });
