import { apiClient } from '@/lib/api-client';
import type { AppSettings, AppSettingsMutationPayload } from './types';

export async function getSettings(): Promise<AppSettings> {
  return apiClient<AppSettings>('/settings');
}

export async function updateSettings(values: AppSettingsMutationPayload): Promise<AppSettings> {
  return apiClient<AppSettings>('/settings', {
    method: 'PUT',
    body: JSON.stringify(values)
  });
}
