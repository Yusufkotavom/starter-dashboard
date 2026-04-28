export type Priority = 'low' | 'medium' | 'high';
export type KanbanColumnKey = 'backlog' | 'todo' | 'inProgress' | 'review' | 'done';

export interface KanbanTask {
  id: number;
  title: string;
  description?: string;
  assignee?: string;
  priority: Priority;
  column: KanbanColumnKey;
  orderIndex: number;
  dueDate?: string;
}

export interface KanbanTasksResponse {
  columns: Record<KanbanColumnKey, KanbanTask[]>;
}

export interface CreateKanbanTaskPayload {
  projectId?: number;
  title: string;
  description?: string;
  assignee?: string;
  priority?: Priority;
}

export interface UpdateKanbanTaskPayload {
  title?: string;
  description?: string;
  assignee?: string;
  priority?: Priority;
  column?: KanbanColumnKey;
  dueDate?: string;
}

export interface ReorderKanbanTasksPayload {
  projectId?: number;
  columns: Record<KanbanColumnKey, Array<{ id: number }>>;
}
