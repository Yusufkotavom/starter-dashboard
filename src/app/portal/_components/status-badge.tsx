import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  value: string;
  tone?: 'default' | 'success' | 'warning' | 'danger';
}

const toneStyles: Record<NonNullable<StatusBadgeProps['tone']>, string> = {
  default: 'border-slate-200 bg-slate-50 text-slate-700',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-700',
  danger: 'border-rose-200 bg-rose-50 text-rose-700'
};

export function StatusBadge({ value, tone = 'default' }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full border px-2.5 py-1 text-xs font-medium tracking-wide',
        toneStyles[tone]
      )}
    >
      {value.replaceAll('_', ' ')}
    </span>
  );
}
