'use client';

import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { KanbanColumn, KanbanColumnHandle } from '@/components/ui/kanban';
import type { KanbanColumnKey, Task } from '../utils/store';
import { TaskCard } from './task-card';

export const COLUMN_TITLES: Record<KanbanColumnKey, string> = {
  backlog: 'Backlog',
  todo: 'Todo',
  inProgress: 'In Progress',
  review: 'Review',
  done: 'Done'
};

interface TaskColumnProps extends Omit<React.ComponentProps<typeof KanbanColumn>, 'children'> {
  tasks: Task[];
}

export function TaskColumn({ value, tasks, ...props }: TaskColumnProps) {
  const columnKey = value as KanbanColumnKey;

  return (
    <KanbanColumn
      value={value}
      className='h-full w-[86vw] shrink-0 snap-start sm:w-[320px] xl:w-[340px]'
      {...props}
    >
      <div className='bg-background/90 sticky top-0 z-10 -mx-1 flex items-center justify-between rounded-md px-1 py-1 backdrop-blur supports-[backdrop-filter]:bg-background/70'>
        <div className='flex min-w-0 items-center gap-2'>
          <span className='text-sm font-semibold'>{COLUMN_TITLES[columnKey] ?? columnKey}</span>
          <Badge variant='secondary' className='pointer-events-none rounded-sm'>
            {tasks.length}
          </Badge>
        </div>
        <KanbanColumnHandle asChild>
          <Button variant='ghost' size='icon' className='size-8'>
            <Icons.gripVertical className='h-4 w-4' />
          </Button>
        </KanbanColumnHandle>
      </div>
      <div className='mt-1 flex flex-1 flex-col gap-2 overflow-y-auto pr-0.5'>
        {tasks.map((task) => {
          return <TaskCard key={task.id} task={task} column={columnKey} />;
        })}
      </div>
    </KanbanColumn>
  );
}
