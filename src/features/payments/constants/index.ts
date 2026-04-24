export const PAYMENT_METHOD_OPTIONS = [
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
  { value: 'QRIS', label: 'QRIS' },
  { value: 'CASH', label: 'Cash' },
  { value: 'CARD', label: 'Card' }
] as const;

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  BANK_TRANSFER: 'Bank Transfer',
  QRIS: 'QRIS',
  CASH: 'Cash',
  CARD: 'Card'
};
