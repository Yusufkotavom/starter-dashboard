'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Kanban, KanbanBoard as KanbanBoardPrimitive, KanbanOverlay } from '@/components/ui/kanban';
import { useTaskStore, type KanbanColumnKey } from '../utils/store';
import { COLUMN_TITLES, TaskColumn } from './board-column';
import { TaskCard } from './task-card';
import { createRestrictToContainer } from '../utils/restrict-to-container';

interface KanbanBoardProps {
  fullScreen?: boolean;
}

export function KanbanBoard({ fullScreen = false }: KanbanBoardProps) {
  const { columns, setColumns } = useTaskStore();
  const [activeColumn, setActiveColumn] = useState<KanbanColumnKey>('backlog');
  const containerRef = useRef<HTMLDivElement>(null);
  const columnEntries = useMemo(
    () => Object.entries(columns) as [KanbanColumnKey, (typeof columns)[KanbanColumnKey]][],
    [columns]
  );
  const mobileColumnEntries = useMemo(
    () => columnEntries.filter(([columnValue]) => columnValue === activeColumn),
    [columnEntries, activeColumn]
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps -- factory function, stable after mount
  const restrictToBoard = useCallback(
    createRestrictToContainer(() => containerRef.current),
    []
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

      <Kanban
        value={columns}
        onValueChange={setColumns}
        getItemValue={(item) => item.id}
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
                <TaskColumn key={columnValue} value={columnValue} tasks={tasks} />
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
                <TaskColumn key={columnValue} value={columnValue} tasks={tasks} />
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
              return <TaskColumn value={columnKey} tasks={tasks} />;
            }

            const task = Object.values(columns)
              .flat()
              .find((task) => task.id === value);

            if (!task) return null;
            const column = columnEntries.find(([, items]) =>
              items.some((columnTask) => columnTask.id === value)
            )?.[0];
            if (!column) return null;
            return <TaskCard task={task} column={column} />;
          }}
        </KanbanOverlay>
      </Kanban>
    </div>
  );
}
