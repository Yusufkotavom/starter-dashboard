export const PROJECT_STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'PAUSED', label: 'Paused' },
  { value: 'CANCELLED', label: 'Cancelled' }
] as const;

export const PROJECT_STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  COMPLETED: 'text-sky-700 bg-sky-50 border-sky-200',
  PAUSED: 'text-amber-700 bg-amber-50 border-amber-200',
  CANCELLED: 'text-rose-700 bg-rose-50 border-rose-200'
};

export const PROJECT_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Active',
  COMPLETED: 'Completed',
  PAUSED: 'Paused',
  CANCELLED: 'Cancelled'
};
