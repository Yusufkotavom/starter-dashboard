import { revalidateTag, unstable_cache } from 'next/cache';
import { Prisma } from '@/lib/prisma-client';
import { prisma } from '@/lib/prisma';

const APP_SETTINGS_CACHE_TAG = 'app-settings';

export interface AppSettingsSnapshot {
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

export interface AppSettingsInput {
  companyName: string;
  companyEmail: string;
  companyLogoUrl?: string | null;
  defaultCurrency: string;
  invoicePrefix: string;
  quotationPrefix: string;
  paymentTermsDays: number;
  taxRate: number;
  requiresApproval: boolean;
  paymentBankName?: string | null;
  paymentAccountName?: string | null;
  paymentAccountNumber?: string | null;
  paymentQrisUrl?: string | null;
  whatsappProvider: 'EMULATOR' | 'BRIDGE';
  whatsappBridgeUrl?: string | null;
  whatsappApiKey?: string | null;
  whatsappSessionName?: string | null;
  whatsappCountryCode: string;
}

function normalizeOptional(value?: string | null): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

export function getDefaultAppSettings(): AppSettingsSnapshot {
  return {
    companyName: 'Open Agency Studio',
    companyEmail: 'finance@openagency.test',
    companyLogoUrl: null,
    defaultCurrency: 'IDR',
    invoicePrefix: 'INV',
    quotationPrefix: 'QUO',
    paymentTermsDays: 14,
    taxRate: 11,
    requiresApproval: true,
    paymentBankName: null,
    paymentAccountName: null,
    paymentAccountNumber: null,
    paymentQrisUrl: null,
    whatsappProvider: 'EMULATOR',
    whatsappBridgeUrl: null,
    whatsappApiKey: null,
    whatsappSessionName: null,
    whatsappCountryCode: '62'
  };
}

export function mapAppSettingsRecord(record: {
  companyName: string;
  companyEmail: string;
  companyLogoUrl: string | null;
  defaultCurrency: string;
  invoicePrefix: string;
  quotationPrefix: string;
  paymentTermsDays: number;
  taxRate: Prisma.Decimal;
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
}): AppSettingsSnapshot {
  return {
    companyName: record.companyName,
    companyEmail: record.companyEmail,
    companyLogoUrl: record.companyLogoUrl,
    defaultCurrency: record.defaultCurrency,
    invoicePrefix: record.invoicePrefix,
    quotationPrefix: record.quotationPrefix,
    paymentTermsDays: record.paymentTermsDays,
    taxRate: Number(record.taxRate),
    requiresApproval: record.requiresApproval,
    paymentBankName: record.paymentBankName,
    paymentAccountName: record.paymentAccountName,
    paymentAccountNumber: record.paymentAccountNumber,
    paymentQrisUrl: record.paymentQrisUrl,
    whatsappProvider: record.whatsappProvider,
    whatsappBridgeUrl: record.whatsappBridgeUrl,
    whatsappApiKey: record.whatsappApiKey,
    whatsappSessionName: record.whatsappSessionName,
    whatsappCountryCode: record.whatsappCountryCode
  };
}

const getCachedAppSettings = unstable_cache(
  async (): Promise<AppSettingsSnapshot> => {
    const record = await prisma.appSettings.findUnique({
      where: { id: 1 }
    });

    return record ? mapAppSettingsRecord(record) : getDefaultAppSettings();
  },
  ['app-settings'],
  {
    tags: [APP_SETTINGS_CACHE_TAG]
  }
);

export async function getAppSettings(): Promise<AppSettingsSnapshot> {
  return getCachedAppSettings();
}

export async function invalidateAppSettingsCache(): Promise<void> {
  revalidateTag(APP_SETTINGS_CACHE_TAG, 'max');
}

export async function saveAppSettings(input: AppSettingsInput): Promise<AppSettingsSnapshot> {
  const savedRecord = await prisma.appSettings.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      companyName: input.companyName.trim(),
      companyEmail: input.companyEmail.trim(),
      companyLogoUrl: normalizeOptional(input.companyLogoUrl),
      defaultCurrency: input.defaultCurrency.trim().toUpperCase(),
      invoicePrefix: input.invoicePrefix.trim().toUpperCase(),
      quotationPrefix: input.quotationPrefix.trim().toUpperCase(),
      paymentTermsDays: input.paymentTermsDays,
      taxRate: new Prisma.Decimal(input.taxRate),
      requiresApproval: input.requiresApproval,
      paymentBankName: normalizeOptional(input.paymentBankName),
      paymentAccountName: normalizeOptional(input.paymentAccountName),
      paymentAccountNumber: normalizeOptional(input.paymentAccountNumber),
      paymentQrisUrl: normalizeOptional(input.paymentQrisUrl),
      whatsappProvider: input.whatsappProvider,
      whatsappBridgeUrl: normalizeOptional(input.whatsappBridgeUrl),
      whatsappApiKey: normalizeOptional(input.whatsappApiKey),
      whatsappSessionName: normalizeOptional(input.whatsappSessionName),
      whatsappCountryCode: input.whatsappCountryCode.trim() || '62'
    },
    update: {
      companyName: input.companyName.trim(),
      companyEmail: input.companyEmail.trim(),
      companyLogoUrl: normalizeOptional(input.companyLogoUrl),
      defaultCurrency: input.defaultCurrency.trim().toUpperCase(),
      invoicePrefix: input.invoicePrefix.trim().toUpperCase(),
      quotationPrefix: input.quotationPrefix.trim().toUpperCase(),
      paymentTermsDays: input.paymentTermsDays,
      taxRate: new Prisma.Decimal(input.taxRate),
      requiresApproval: input.requiresApproval,
      paymentBankName: normalizeOptional(input.paymentBankName),
      paymentAccountName: normalizeOptional(input.paymentAccountName),
      paymentAccountNumber: normalizeOptional(input.paymentAccountNumber),
      paymentQrisUrl: normalizeOptional(input.paymentQrisUrl),
      whatsappProvider: input.whatsappProvider,
      whatsappBridgeUrl: normalizeOptional(input.whatsappBridgeUrl),
      whatsappApiKey: normalizeOptional(input.whatsappApiKey),
      whatsappSessionName: normalizeOptional(input.whatsappSessionName),
      whatsappCountryCode: input.whatsappCountryCode.trim() || '62'
    }
  });

  await invalidateAppSettingsCache();

  return mapAppSettingsRecord(savedRecord);
}
