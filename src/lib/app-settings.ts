import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export interface AppSettingsSnapshot {
  companyName: string;
  companyEmail: string;
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
}

export interface AppSettingsInput {
  companyName: string;
  companyEmail: string;
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
}

function normalizeOptional(value?: string | null): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

export function getDefaultAppSettings(): AppSettingsSnapshot {
  return {
    companyName: 'Open Agency Studio',
    companyEmail: 'finance@openagency.test',
    defaultCurrency: 'IDR',
    invoicePrefix: 'INV',
    quotationPrefix: 'QUO',
    paymentTermsDays: 14,
    taxRate: 11,
    requiresApproval: true,
    paymentBankName: null,
    paymentAccountName: null,
    paymentAccountNumber: null,
    paymentQrisUrl: null
  };
}

export function mapAppSettingsRecord(record: {
  companyName: string;
  companyEmail: string;
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
}): AppSettingsSnapshot {
  return {
    companyName: record.companyName,
    companyEmail: record.companyEmail,
    defaultCurrency: record.defaultCurrency,
    invoicePrefix: record.invoicePrefix,
    quotationPrefix: record.quotationPrefix,
    paymentTermsDays: record.paymentTermsDays,
    taxRate: Number(record.taxRate),
    requiresApproval: record.requiresApproval,
    paymentBankName: record.paymentBankName,
    paymentAccountName: record.paymentAccountName,
    paymentAccountNumber: record.paymentAccountNumber,
    paymentQrisUrl: record.paymentQrisUrl
  };
}

export async function getAppSettings(): Promise<AppSettingsSnapshot> {
  const record = await prisma.appSettings.findUnique({
    where: { id: 1 }
  });

  return record ? mapAppSettingsRecord(record) : getDefaultAppSettings();
}

export async function saveAppSettings(input: AppSettingsInput): Promise<AppSettingsSnapshot> {
  const record = await prisma.appSettings.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      companyName: input.companyName.trim(),
      companyEmail: input.companyEmail.trim(),
      defaultCurrency: input.defaultCurrency.trim().toUpperCase(),
      invoicePrefix: input.invoicePrefix.trim().toUpperCase(),
      quotationPrefix: input.quotationPrefix.trim().toUpperCase(),
      paymentTermsDays: input.paymentTermsDays,
      taxRate: new Prisma.Decimal(input.taxRate),
      requiresApproval: input.requiresApproval,
      paymentBankName: normalizeOptional(input.paymentBankName),
      paymentAccountName: normalizeOptional(input.paymentAccountName),
      paymentAccountNumber: normalizeOptional(input.paymentAccountNumber),
      paymentQrisUrl: normalizeOptional(input.paymentQrisUrl)
    },
    update: {
      companyName: input.companyName.trim(),
      companyEmail: input.companyEmail.trim(),
      defaultCurrency: input.defaultCurrency.trim().toUpperCase(),
      invoicePrefix: input.invoicePrefix.trim().toUpperCase(),
      quotationPrefix: input.quotationPrefix.trim().toUpperCase(),
      paymentTermsDays: input.paymentTermsDays,
      taxRate: new Prisma.Decimal(input.taxRate),
      requiresApproval: input.requiresApproval,
      paymentBankName: normalizeOptional(input.paymentBankName),
      paymentAccountName: normalizeOptional(input.paymentAccountName),
      paymentAccountNumber: normalizeOptional(input.paymentAccountNumber),
      paymentQrisUrl: normalizeOptional(input.paymentQrisUrl)
    }
  });

  return mapAppSettingsRecord(record);
}
