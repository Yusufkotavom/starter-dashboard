import { queryOptions } from '@tanstack/react-query';
import { getKanbanTasks } from './service';

export const kanbanKeys = {
  all: ['kanban'] as const,
  board: (projectId?: number) => [...kanbanKeys.all, 'board', projectId ?? 'global'] as const
};

export const kanbanBoardQueryOptions = (projectId?: number) =>
  queryOptions({
    queryKey: kanbanKeys.board(projectId),
    queryFn: () => getKanbanTasks(projectId)
  });
