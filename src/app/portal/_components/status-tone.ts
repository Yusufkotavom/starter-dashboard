export function getStatusTone(value: string): 'default' | 'success' | 'warning' | 'danger' {
  if (['PAID', 'APPROVED', 'ACTIVE', 'COMPLETED'].includes(value)) return 'success';
  if (['OVERDUE', 'REJECTED', 'CANCELLED', 'EXPIRED'].includes(value)) return 'danger';
  if (['PARTIAL', 'PAUSED', 'SENT'].includes(value)) return 'warning';
  return 'default';
}
