import { apiClient } from '@/lib/api-client';
import type {
  CreateKanbanTaskPayload,
  KanbanTasksResponse,
  ReorderKanbanTasksPayload,
  UpdateKanbanTaskPayload
} from './types';

function buildProjectQuery(projectId?: number): string {
  if (!projectId) {
    return '';
  }

  return `?projectId=${projectId}`;
}

export async function getKanbanTasks(projectId?: number): Promise<KanbanTasksResponse> {
  return apiClient<KanbanTasksResponse>(`/kanban/tasks${buildProjectQuery(projectId)}`);
}

export async function createKanbanTask(payload: CreateKanbanTaskPayload) {
  return apiClient('/kanban/tasks', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function updateKanbanTask(id: number, payload: UpdateKanbanTaskPayload) {
  return apiClient(`/kanban/tasks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });
}

export async function deleteKanbanTask(id: number) {
  return apiClient(`/kanban/tasks/${id}`, {
    method: 'DELETE'
  });
}

export async function reorderKanbanTasks(payload: ReorderKanbanTasksPayload) {
  return apiClient('/kanban/tasks/reorder', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}
