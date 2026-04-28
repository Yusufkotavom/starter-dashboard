import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import {
  createKanbanTask,
  deleteKanbanTask,
  reorderKanbanTasks,
  updateKanbanTask
} from './service';
import { kanbanKeys } from './queries';
import type {
  CreateKanbanTaskPayload,
  ReorderKanbanTasksPayload,
  UpdateKanbanTaskPayload
} from './types';

export const createKanbanTaskMutation = mutationOptions({
  mutationFn: (payload: CreateKanbanTaskPayload) => createKanbanTask(payload),
  onSuccess: () => getQueryClient().invalidateQueries({ queryKey: kanbanKeys.all })
});

export const updateKanbanTaskMutation = mutationOptions({
  mutationFn: ({ id, payload }: { id: number; payload: UpdateKanbanTaskPayload }) =>
    updateKanbanTask(id, payload),
  onSuccess: () => getQueryClient().invalidateQueries({ queryKey: kanbanKeys.all })
});

export const deleteKanbanTaskMutation = mutationOptions({
  mutationFn: (id: number) => deleteKanbanTask(id),
  onSuccess: () => getQueryClient().invalidateQueries({ queryKey: kanbanKeys.all })
});

export const reorderKanbanTasksMutation = mutationOptions({
  mutationFn: (payload: ReorderKanbanTasksPayload) => reorderKanbanTasks(payload),
  onSuccess: () => getQueryClient().invalidateQueries({ queryKey: kanbanKeys.all })
});
