import { queryOptions } from '@tanstack/react-query';
import { getProjectById, getProjects } from './service';
import type { Project, ProjectFilters } from './types';

export type { Project };

export const projectKeys = {
  all: ['projects'] as const,
  list: (filters: ProjectFilters) => [...projectKeys.all, 'list', filters] as const,
  detail: (id: number) => [...projectKeys.all, 'detail', id] as const
};

export const projectsQueryOptions = (filters: ProjectFilters) =>
  queryOptions({
    queryKey: projectKeys.list(filters),
    queryFn: () => getProjects(filters)
  });

export const projectByIdOptions = (id: number) =>
  queryOptions({
    queryKey: projectKeys.detail(id),
    queryFn: () => getProjectById(id)
  });
