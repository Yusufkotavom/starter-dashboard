export interface AppSettings {
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

export type AppSettingsMutationPayload = AppSettings;
