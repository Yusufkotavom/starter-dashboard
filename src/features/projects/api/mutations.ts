import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { createProject, deleteProject, updateProject } from './service';
import { projectKeys } from './queries';
import type { ProjectMutationPayload } from './types';

export const createProjectMutation = mutationOptions({
  mutationFn: (data: ProjectMutationPayload) => createProject(data),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: projectKeys.all });
  }
});

export const updateProjectMutation = mutationOptions({
  mutationFn: ({ id, values }: { id: number; values: ProjectMutationPayload }) =>
    updateProject(id, values),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: projectKeys.all });
  }
});

export const deleteProjectMutation = mutationOptions({
  mutationFn: (id: number) => deleteProject(id),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: projectKeys.all });
  }
});
