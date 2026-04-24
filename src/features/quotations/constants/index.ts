export const QUOTATION_STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'SENT', label: 'Sent' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'EXPIRED', label: 'Expired' }
] as const;

export const QUOTATION_STATUS_COLORS: Record<string, string> = {
  DRAFT: 'text-slate-700 bg-slate-50 border-slate-200',
  SENT: 'text-sky-700 bg-sky-50 border-sky-200',
  APPROVED: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  REJECTED: 'text-rose-700 bg-rose-50 border-rose-200',
  EXPIRED: 'text-amber-700 bg-amber-50 border-amber-200'
};

export const QUOTATION_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  SENT: 'Sent',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  EXPIRED: 'Expired'
};
