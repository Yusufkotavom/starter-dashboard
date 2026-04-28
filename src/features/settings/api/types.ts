export interface AppSettings {
  companyName: string;
  companyEmail: string;
  companyLogoUrl: string | null;
  defaultCurrency: string;
  invoicePrefix: string;
  quotationPrefix: string;
  paymentTermsDays: number;
  taxRate: number;
  requiresApproval: boolean;
  paymentBankName: string | null;
  paymentAccountName: string | null;
  paymentAccountNumber: string | null;
  paymentQrisUrl: string | null;
  whatsappProvider: 'EMULATOR' | 'BRIDGE';
  whatsappBridgeUrl: string | null;
  whatsappApiKey: string | null;
  whatsappSessionName: string | null;
  whatsappCountryCode: string;
}

export type AppSettingsMutationPayload = AppSettings;

export interface WhatsAppSetupStatus {
  provider: 'EMULATOR' | 'BRIDGE';
  configured: boolean;
  bridgeUrl: string | null;
  sessionName: string | null;
  apiKeyConfigured: boolean;
  reachable: boolean;
  sessionExists: boolean;
  sessionStatus: string | null;
  engine: string | null;
  screenshotUrl: string | null;
  message: string;
}

export interface IntegrationKeyRecord {
  id: number;
  organizationId: string | null;
  name: string;
  keyPrefix: string;
  scopes: string[];
  isActive: boolean;
  lastUsedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IntegrationKeysResponse {
  items: IntegrationKeyRecord[];
}

export interface CreateIntegrationKeyPayload {
  name: string;
  scopes: string[];
}

export interface CreateIntegrationKeyResponse {
  key: string;
  record: IntegrationKeyRecord;
}
