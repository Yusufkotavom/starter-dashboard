'use client';

import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { KanbanItem, KanbanItemHandle } from '@/components/ui/kanban';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { COLUMN_TITLES } from './board-column';
import type { KanbanColumnKey, KanbanTask } from '../api/types';

interface TaskCardProps extends Omit<React.ComponentProps<typeof KanbanItem>, 'value'> {
  task: KanbanTask;
  column: KanbanColumnKey;
  onMoveTask: (taskId: number, targetColumn: KanbanColumnKey) => void;
}

export function TaskCard({ task, column, onMoveTask, ...props }: TaskCardProps) {
  const isDone = column === 'done';

  return (
    <KanbanItem key={task.id} value={task.id} asChild {...props}>
      <div className='bg-card rounded-md border p-2.5 shadow-xs transition-shadow hover:shadow-sm'>
        <div className='flex flex-col gap-2.5'>
          <div className='flex items-start gap-2'>
            <Checkbox
              checked={isDone}
              className='mt-0.5'
              onCheckedChange={(checked) => onMoveTask(task.id, checked ? 'done' : 'backlog')}
              aria-label={`Mark ${task.title} as done`}
            />
            <div className='min-w-0 flex-1 space-y-1'>
              <span
                className={cn(
                  'line-clamp-2 block text-sm font-medium leading-tight',
                  isDone && 'text-muted-foreground line-through'
                )}
              >
                {task.title}
              </span>
              {task.description ? (
                <p className='text-muted-foreground line-clamp-2 text-xs'>{task.description}</p>
              ) : null}
            </div>
            <Badge
              variant={
                task.priority === 'high'
                  ? 'destructive'
                  : task.priority === 'medium'
                    ? 'default'
                    : 'secondary'
              }
              className='pointer-events-none h-5 rounded-sm px-1.5 text-[11px] capitalize'
            >
              {task.priority}
            </Badge>
          </div>

          <div className='text-muted-foreground flex flex-wrap items-center justify-between gap-2 text-xs'>
            <div className='flex min-w-0 items-center gap-1'>
              {task.assignee ? (
                <>
                  <div className='bg-primary/20 size-2 rounded-full' />
                  <span className='line-clamp-1'>{task.assignee}</span>
                </>
              ) : (
                <span>Unassigned</span>
              )}
            </div>
            {task.dueDate ? <time className='text-[10px] tabular-nums'>{task.dueDate}</time> : null}
          </div>

          <div className='flex items-center justify-between gap-2'>
            <Select
              value={column}
              onValueChange={(value) => onMoveTask(task.id, value as KanbanColumnKey)}
            >
              <SelectTrigger size='sm' className='h-7 w-full text-xs'>
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

            <KanbanItemHandle asChild>
              <button
                type='button'
                aria-label='Drag task'
                className='text-muted-foreground hover:text-foreground inline-flex size-7 shrink-0 items-center justify-center rounded border'
              >
                <Icons.gripVertical className='h-4 w-4' />
              </button>
            </KanbanItemHandle>
          </div>
          <div className='flex items-center gap-1 text-[11px]'>
            {column === 'backlog' ? (
              <span className='text-muted-foreground'>Todo</span>
            ) : (
              <div className='flex items-center gap-1'>
                <Icons.circleCheck className='h-3.5 w-3.5' />
                <span className='text-muted-foreground'>{COLUMN_TITLES[column]}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </KanbanItem>
  );
}
