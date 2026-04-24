import { fakeProjects } from '@/constants/mock-api-projects';

export const EXPENSE_PROJECT_OPTIONS = [
  { value: 0, label: 'Unassigned expense' },
  ...fakeProjects.records.map((project) => ({
    value: project.id,
    label: project.name
  }))
];

export const EXPENSE_CATEGORY_OPTIONS = [
  { value: 'Vendor', label: 'Vendor' },
  { value: 'Freelancer', label: 'Freelancer' },
  { value: 'Tools', label: 'Tools' },
  { value: 'Hosting', label: 'Hosting' },
  { value: 'Ads', label: 'Ads' },
  { value: 'Operational', label: 'Operational' }
] as const;
