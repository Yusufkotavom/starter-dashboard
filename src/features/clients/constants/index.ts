export const CLIENT_STATUS_OPTIONS = [
  { value: 'LEAD', label: 'Lead' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'ARCHIVED', label: 'Archived' }
] as const;

export const CLIENT_STATUS_COLORS: Record<string, string> = {
  LEAD: 'text-blue-600 bg-blue-50 border-blue-200',
  ACTIVE: 'text-green-600 bg-green-50 border-green-200',
  INACTIVE: 'text-amber-600 bg-amber-50 border-amber-200',
  ARCHIVED: 'text-gray-500 bg-gray-50 border-gray-200'
};

export const CLIENT_STATUS_LABELS: Record<string, string> = {
  LEAD: 'Lead',
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  ARCHIVED: 'Archived'
};
