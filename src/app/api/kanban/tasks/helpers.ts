import { KanbanColumn, Prisma } from '@prisma/client';
import type { KanbanColumnKey, KanbanTask } from '@/features/kanban/api/types';

export const COLUMN_FROM_DB: Record<KanbanColumn, KanbanColumnKey> = {
  BACKLOG: 'backlog',
  TODO: 'todo',
  IN_PROGRESS: 'inProgress',
  REVIEW: 'review',
  DONE: 'done'
};

export const COLUMN_TO_DB: Record<KanbanColumnKey, KanbanColumn> = {
  backlog: 'BACKLOG',
  todo: 'TODO',
  inProgress: 'IN_PROGRESS',
  review: 'REVIEW',
  done: 'DONE'
};

export function mapTask(task: Prisma.KanbanTaskGetPayload<Record<string, never>>): KanbanTask {
  return {
    id: task.id,
    title: task.title,
    description: task.description ?? undefined,
    assignee: task.assignee ?? undefined,
    priority:
      task.priority === 'high' || task.priority === 'medium' || task.priority === 'low'
        ? task.priority
        : 'medium',
    column: COLUMN_FROM_DB[task.column],
    orderIndex: task.orderIndex,
    dueDate: task.dueDate ?? undefined
  };
}

export function buildEmptyColumns() {
  return {
    backlog: [],
    todo: [],
    inProgress: [],
    review: [],
    done: []
  } as Record<KanbanColumnKey, KanbanTask[]>;
}
