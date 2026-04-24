export const INVOICE_STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'SENT', label: 'Sent' },
  { value: 'PAID', label: 'Paid' },
  { value: 'PARTIAL', label: 'Partial' },
  { value: 'OVERDUE', label: 'Overdue' },
  { value: 'CANCELLED', label: 'Cancelled' }
] as const;

export const INVOICE_STATUS_COLORS: Record<string, string> = {
  DRAFT: 'text-slate-700 bg-slate-50 border-slate-200',
  SENT: 'text-sky-700 bg-sky-50 border-sky-200',
  PAID: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  PARTIAL: 'text-violet-700 bg-violet-50 border-violet-200',
  OVERDUE: 'text-rose-700 bg-rose-50 border-rose-200',
  CANCELLED: 'text-amber-700 bg-amber-50 border-amber-200'
};

export const INVOICE_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  SENT: 'Sent',
  PAID: 'Paid',
  PARTIAL: 'Partial',
  OVERDUE: 'Overdue',
  CANCELLED: 'Cancelled'
};
