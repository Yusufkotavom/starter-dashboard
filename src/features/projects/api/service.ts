import { fakeProjects } from '@/constants/mock-api-projects';
import type { Project, ProjectFilters, ProjectsResponse, ProjectMutationPayload } from './types';

export async function getProjects(filters: ProjectFilters): Promise<ProjectsResponse> {
  return fakeProjects.getProjects(filters);
}

export async function getProjectById(id: number): Promise<Project | null> {
  return fakeProjects.getProjectById(id);
}

export async function createProject(data: ProjectMutationPayload): Promise<Project> {
  return fakeProjects.createProject({
    name: data.name,
    clientId: data.clientId,
    quotationId: data.quotationId ?? null,
    status: data.status,
    startDate: data.startDate ?? null,
    endDate: data.endDate ?? null,
    budget: data.budget ?? null,
    notes: data.notes ?? null
  });
}

export async function updateProject(id: number, data: ProjectMutationPayload): Promise<Project> {
  return fakeProjects.updateProject(id, {
    name: data.name,
    clientId: data.clientId,
    quotationId: data.quotationId ?? null,
    status: data.status,
    startDate: data.startDate ?? null,
    endDate: data.endDate ?? null,
    budget: data.budget ?? null,
    notes: data.notes ?? null
  });
}

export async function deleteProject(id: number): Promise<void> {
  return fakeProjects.deleteProject(id);
}
