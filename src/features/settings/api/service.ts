import { apiClient } from '@/lib/api-client';
import type {
  AppSettings,
  AppSettingsMutationPayload,
  CreateIntegrationKeyPayload,
  CreateIntegrationKeyResponse,
  IntegrationKeysResponse,
  WhatsAppSetupStatus
} from './types';

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

export async function getIntegrationKeys(): Promise<IntegrationKeysResponse> {
  return apiClient<IntegrationKeysResponse>('/settings/integration-keys');
}

export async function createIntegrationKey(
  values: CreateIntegrationKeyPayload
): Promise<CreateIntegrationKeyResponse> {
  return apiClient<CreateIntegrationKeyResponse>('/settings/integration-keys', {
    method: 'POST',
    body: JSON.stringify(values)
  });
}
