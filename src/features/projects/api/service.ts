import { apiClient } from '@/lib/api-client';
import type { Project, ProjectFilters, ProjectsResponse, ProjectMutationPayload } from './types';

function createProjectQueryString(filters: ProjectFilters): string {
  const searchParams = new URLSearchParams();

  if (filters.page) searchParams.set('page', String(filters.page));
  if (filters.limit) searchParams.set('limit', String(filters.limit));
  if (filters.search) searchParams.set('search', filters.search);
  if (filters.status) searchParams.set('status', filters.status);
  if (filters.sort) searchParams.set('sort', filters.sort);

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

export async function getProjects(filters: ProjectFilters): Promise<ProjectsResponse> {
  return apiClient<ProjectsResponse>(`/projects${createProjectQueryString(filters)}`);
}

export async function getProjectById(id: number): Promise<Project | null> {
  return apiClient<Project>(`/projects/${id}`);
}

export async function createProject(data: ProjectMutationPayload): Promise<Project> {
  return apiClient<Project>('/projects', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function updateProject(id: number, data: ProjectMutationPayload): Promise<Project> {
  return apiClient<Project>(`/projects/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

export async function deleteProject(id: number): Promise<void> {
  await apiClient(`/projects/${id}`, {
    method: 'DELETE'
  });
}
