'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Kanban, KanbanBoard as KanbanBoardPrimitive, KanbanOverlay } from '@/components/ui/kanban';
import { kanbanBoardQueryOptions } from '../api/queries';
import { reorderKanbanTasksMutation } from '../api/mutations';
import type { KanbanColumnKey, KanbanTask } from '../api/types';
import { COLUMN_TITLES, TaskColumn } from './board-column';
import { TaskCard } from './task-card';
import { createRestrictToContainer } from '../utils/restrict-to-container';

interface KanbanBoardProps {
  fullScreen?: boolean;
  projectId?: number;
}

function getEmptyColumns(): Record<KanbanColumnKey, KanbanTask[]> {
  return {
    backlog: [],
    todo: [],
    inProgress: [],
    review: [],
    done: []
  };
}

function moveTaskLocally(
  current: Record<KanbanColumnKey, KanbanTask[]>,
  taskId: number,
  targetColumn: KanbanColumnKey
) {
  const nextColumns: Record<KanbanColumnKey, KanbanTask[]> = {
    backlog: [...current.backlog],
    todo: [...current.todo],
    inProgress: [...current.inProgress],
    review: [...current.review],
    done: [...current.done]
  };

  let taskToMove: KanbanTask | null = null;
  for (const columnKey of Object.keys(nextColumns) as KanbanColumnKey[]) {
    const index = nextColumns[columnKey].findIndex((task) => task.id === taskId);
    if (index !== -1) {
      const [task] = nextColumns[columnKey].splice(index, 1);
      taskToMove = task;
      break;
    }
  }

  if (!taskToMove) {
    return nextColumns;
  }

  nextColumns[targetColumn].unshift({ ...taskToMove, column: targetColumn });
  return nextColumns;
}

function buildReorderColumnsPayload(columns: Record<KanbanColumnKey, KanbanTask[]>) {
  return {
    backlog: columns.backlog.map((task) => ({ id: task.id })),
    todo: columns.todo.map((task) => ({ id: task.id })),
    inProgress: columns.inProgress.map((task) => ({ id: task.id })),
    review: columns.review.map((task) => ({ id: task.id })),
    done: columns.done.map((task) => ({ id: task.id }))
  };
}

export function KanbanBoard({ fullScreen = false, projectId }: KanbanBoardProps) {
  const { data } = useQuery(kanbanBoardQueryOptions(projectId));
  const reorderMutation = useMutation(reorderKanbanTasksMutation);
  const [columns, setColumns] = useState<Record<KanbanColumnKey, KanbanTask[]>>(getEmptyColumns);
  const [activeColumn, setActiveColumn] = useState<KanbanColumnKey>('backlog');
  const [viewMode, setViewMode] = useState<'board' | 'table'>('board');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (data?.columns) {
      setColumns(data.columns);
    }
  }, [data]);

  const columnEntries = useMemo(
    () => Object.entries(columns) as [KanbanColumnKey, (typeof columns)[KanbanColumnKey]][],
    [columns]
  );
  const mobileColumnEntries = useMemo(
    () => columnEntries.filter(([columnValue]) => columnValue === activeColumn),
    [columnEntries, activeColumn]
  );
  const flatTasks = useMemo(
    () =>
      columnEntries.flatMap(([columnKey, tasks]) =>
        tasks.map((task) => ({
          ...task,
          currentColumn: columnKey
        }))
      ),
    [columnEntries]
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps -- factory function, stable after mount
  const restrictToBoard = useCallback(
    createRestrictToContainer(() => containerRef.current),
    []
  );

  const persistReorder = useCallback(
    (nextColumns: Record<KanbanColumnKey, KanbanTask[]>) => {
      reorderMutation.mutate({
        projectId,
        columns: buildReorderColumnsPayload(nextColumns)
      });
    },
    [projectId, reorderMutation]
  );

  const handleMoveTask = useCallback(
    (taskId: number, targetColumn: KanbanColumnKey) => {
      setColumns((current) => {
        const nextColumns = moveTaskLocally(current, taskId, targetColumn);
        persistReorder(nextColumns);
        return nextColumns;
      });
    },
    [persistReorder]
  );

  const handleColumnsChange = useCallback(
    (nextColumns: Record<KanbanColumnKey, KanbanTask[]>) => {
      setColumns(nextColumns);
      persistReorder(nextColumns);
    },
    [persistReorder]
  );

  return (
    <div
      ref={containerRef}
      className={cn(
        'rounded-lg border bg-muted/10 p-2 sm:p-3',
        fullScreen ? 'flex h-full min-h-0 flex-col' : 'lg:h-[calc(100dvh-17rem)] lg:min-h-[38rem]'
      )}
    >
      <div className='mb-3 flex shrink-0 gap-1 overflow-x-auto pb-1 md:hidden'>
        <Button
          size='sm'
          variant={viewMode === 'board' ? 'default' : 'outline'}
          className='h-8 shrink-0 rounded-md px-3 text-xs'
          onClick={() => setViewMode('board')}
        >
          Board
        </Button>
        <Button
          size='sm'
          variant={viewMode === 'table' ? 'default' : 'outline'}
          className='h-8 shrink-0 rounded-md px-3 text-xs'
          onClick={() => setViewMode('table')}
        >
          Table
        </Button>
        {columnEntries.map(([columnKey, tasks]) => (
          <Button
            key={columnKey}
            size='sm'
            variant={activeColumn === columnKey ? 'default' : 'outline'}
            className='h-8 shrink-0 rounded-md px-3 text-xs'
            onClick={() => setActiveColumn(columnKey)}
          >
            {COLUMN_TITLES[columnKey]} ({tasks.length})
          </Button>
        ))}
      </div>

      <div className='mb-3 hidden shrink-0 gap-2 md:flex'>
        <Button
          size='sm'
          variant={viewMode === 'board' ? 'default' : 'outline'}
          onClick={() => setViewMode('board')}
        >
          Board
        </Button>
        <Button
          size='sm'
          variant={viewMode === 'table' ? 'default' : 'outline'}
          onClick={() => setViewMode('table')}
        >
          Table
        </Button>
      </div>

      {viewMode === 'table' ? (
        <div className='overflow-hidden rounded-md border bg-background'>
          <div className='max-h-[calc(100dvh-18rem)] overflow-auto'>
            <table className='w-full min-w-[860px] text-sm'>
              <thead className='bg-muted/40 sticky top-0 z-10'>
                <tr>
                  <th className='px-3 py-2 text-left font-medium'>Task</th>
                  <th className='px-3 py-2 text-left font-medium'>Type</th>
                  <th className='px-3 py-2 text-left font-medium'>Column</th>
                  <th className='px-3 py-2 text-left font-medium'>Priority</th>
                  <th className='px-3 py-2 text-left font-medium'>Assignee</th>
                  <th className='px-3 py-2 text-left font-medium'>Doc</th>
                  <th className='px-3 py-2 text-left font-medium'>Due Date</th>
                </tr>
              </thead>
              <tbody>
                {flatTasks.length === 0 ? (
                  <tr>
                    <td className='text-muted-foreground px-3 py-6 text-center' colSpan={7}>
                      No tasks yet.
                    </td>
                  </tr>
                ) : (
                  flatTasks.map((task) => (
                    <tr key={task.id} className='border-t'>
                      <td className='px-3 py-2 align-top'>
                        <div className='font-medium'>{task.title}</div>
                        {task.description ? (
                          <div className='text-muted-foreground mt-1 line-clamp-2 text-xs'>
                            {task.description}
                          </div>
                        ) : null}
                      </td>
                      <td className='px-3 py-2 align-top'>{task.artifactType}</td>
                      <td className='px-3 py-2 align-top'>
                        <Select
                          value={task.currentColumn}
                          onValueChange={(value) =>
                            handleMoveTask(task.id, value as KanbanColumnKey)
                          }
                        >
                          <SelectTrigger size='sm' className='h-8 min-w-[150px]'>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {(Object.keys(COLUMN_TITLES) as KanbanColumnKey[]).map((columnKey) => (
                              <SelectItem key={columnKey} value={columnKey}>
                                {COLUMN_TITLES[columnKey]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className='px-3 py-2 align-top capitalize'>{task.priority}</td>
                      <td className='px-3 py-2 align-top'>{task.assignee || '-'}</td>
                      <td className='px-3 py-2 align-top'>{task.docId ? `#${task.docId}` : '-'}</td>
                      <td className='px-3 py-2 align-top'>{task.dueDate || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <Kanban
          value={columns}
          onValueChange={handleColumnsChange}
          getItemValue={(item) => String(item.id)}
          modifiers={[restrictToBoard]}
          autoScroll={false}
        >
          <div className={cn('md:hidden', fullScreen && 'flex min-h-0 flex-1 flex-col')}>
            <ScrollArea
              className={cn(
                'w-full rounded-md pb-2',
                fullScreen ? 'h-full flex-1' : 'h-[calc(100dvh-22rem)]'
              )}
            >
              <KanbanBoardPrimitive
                className={cn('flex min-h-full items-start gap-3', fullScreen && 'h-full')}
              >
                {mobileColumnEntries.map(([columnValue, tasks]) => (
                  <TaskColumn
                    key={columnValue}
                    value={columnValue}
                    tasks={tasks}
                    onMoveTask={handleMoveTask}
                  />
                ))}
              </KanbanBoardPrimitive>
            </ScrollArea>
          </div>
          <div className={cn('hidden md:block', fullScreen && 'flex min-h-0 flex-1 flex-col')}>
            <ScrollArea
              className={cn(
                'w-full rounded-md pb-4',
                fullScreen ? 'h-full flex-1' : 'h-[calc(100dvh-17.5rem)] lg:h-full'
              )}
            >
              <KanbanBoardPrimitive
                className={cn(
                  'flex min-h-full snap-x snap-mandatory items-start gap-3',
                  fullScreen && 'h-full'
                )}
              >
                {columnEntries.map(([columnValue, tasks]) => (
                  <TaskColumn
                    key={columnValue}
                    value={columnValue}
                    tasks={tasks}
                    onMoveTask={handleMoveTask}
                  />
                ))}
              </KanbanBoardPrimitive>
              <ScrollBar orientation='horizontal' />
            </ScrollArea>
          </div>
          <KanbanOverlay>
            {({ value, variant }) => {
              if (variant === 'column') {
                const columnKey = value as KanbanColumnKey;
                const tasks = columns[columnKey] ?? [];
                return <TaskColumn value={columnKey} tasks={tasks} onMoveTask={handleMoveTask} />;
              }

              const numericValue = Number(value);
              const task = Object.values(columns)
                .flat()
                .find((task) => task.id === numericValue);

              if (!task) return null;
              const column = columnEntries.find(([, items]) =>
                items.some((columnTask) => columnTask.id === numericValue)
              )?.[0];
              if (!column) return null;
              return <TaskCard task={task} column={column} onMoveTask={handleMoveTask} />;
            }}
          </KanbanOverlay>
        </Kanban>
      )}
    </div>
  );
}
