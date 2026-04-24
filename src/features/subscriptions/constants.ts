export const SUBSCRIPTION_INTERVAL_OPTIONS = [
  { value: 'ONE_TIME', label: 'One Time' },
  { value: 'LIFETIME', label: 'Lifetime' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'QUARTERLY', label: 'Quarterly' },
  { value: 'YEARLY', label: 'Yearly' }
] as const;

export const SUBSCRIPTION_STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'PAUSED', label: 'Paused' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'EXPIRED', label: 'Expired' }
] as const;
