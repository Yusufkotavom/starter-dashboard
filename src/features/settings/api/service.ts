import { apiClient } from '@/lib/api-client';
import type { AppSettings, AppSettingsMutationPayload, WhatsAppSetupStatus } from './types';

export async function getSettings(): Promise<AppSettings> {
  return apiClient<AppSettings>('/settings');
}

export async function updateSettings(values: AppSettingsMutationPayload): Promise<AppSettings> {
  return apiClient<AppSettings>('/settings', {
    method: 'PUT',
    body: JSON.stringify(values)
  });
}

export async function getWhatsAppSetupStatus(): Promise<WhatsAppSetupStatus> {
  return apiClient<WhatsAppSetupStatus>('/settings/whatsapp/status');
}

export async function connectWhatsAppSession(): Promise<WhatsAppSetupStatus> {
  return apiClient<WhatsAppSetupStatus>('/settings/whatsapp/connect', {
    method: 'POST'
  });
}
