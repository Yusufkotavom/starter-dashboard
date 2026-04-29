'use client';

import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { KanbanItem, KanbanItemHandle } from '@/components/ui/kanban';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { deleteKanbanTaskMutation, updateKanbanTaskMutation } from '../api/mutations';
import { COLUMN_TITLES } from './board-column';
import type { KanbanColumnKey, KanbanTask } from '../api/types';

const artifactTypeLabel: Record<KanbanTask['artifactType'], string> = {
  task: 'Task',
  masterplan: 'Masterplan',
  agent_md: 'agent.md',
  readme: 'README',
  doc: 'Document',
  note: 'Note'
};

interface TaskCardProps extends Omit<React.ComponentProps<typeof KanbanItem>, 'value'> {
  task: KanbanTask;
  column: KanbanColumnKey;
  onMoveTask: (taskId: number, targetColumn: KanbanColumnKey) => void;
}

export function TaskCard({ task, column, onMoveTask, ...props }: TaskCardProps) {
  const isDone = column === 'done';
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? '');
  const [assignee, setAssignee] = useState(task.assignee ?? '');
  const [dueDate, setDueDate] = useState(task.dueDate ?? '');
  const [priority, setPriority] = useState<KanbanTask['priority']>(task.priority);

  const updateTask = useMutation({
    ...updateKanbanTaskMutation,
    onSuccess: () => {
      setOpen(false);
    }
  });
  const deleteTask = useMutation({
    ...deleteKanbanTaskMutation,
    onSuccess: () => {
      setOpen(false);
    }
  });

  useEffect(() => {
    if (!open) return;
    setTitle(task.title);
    setDescription(task.description ?? '');
    setAssignee(task.assignee ?? '');
    setDueDate(task.dueDate ?? '');
    setPriority(task.priority);
  }, [open, task]);

  const isSaving = updateTask.isPending || deleteTask.isPending;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim()) {
      return;
    }

    updateTask.mutate({
      id: task.id,
      payload: {
        title: title.trim(),
        description: description.trim(),
        assignee: assignee.trim(),
        dueDate: dueDate.trim(),
        priority
      }
    });
  }

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
              <div className='flex flex-wrap items-center gap-1.5'>
                <Badge variant='outline' className='h-5 rounded-sm px-1.5 text-[10px]'>
                  {artifactTypeLabel[task.artifactType]}
                </Badge>
                {task.artifactPath ? (
                  <span className='text-muted-foreground line-clamp-1 text-[10px]'>
                    {task.artifactPath}
                  </span>
                ) : null}
                {task.docId ? (
                  <span className='text-muted-foreground text-[10px]'>Doc #{task.docId}</span>
                ) : null}
              </div>
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
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant='ghost' size='sm' className='h-7 justify-start px-2 text-xs'>
                Open detail
              </Button>
            </DialogTrigger>
            <DialogContent className='sm:max-w-[560px]'>
              <DialogHeader>
                <DialogTitle>{task.title}</DialogTitle>
                <DialogDescription>
                  {artifactTypeLabel[task.artifactType]}
                  {task.artifactPath ? ` · ${task.artifactPath}` : ''}
                </DialogDescription>
              </DialogHeader>
              <form className='space-y-3 text-sm' onSubmit={handleSubmit}>
                <div className='space-y-1'>
                  <div className='text-muted-foreground text-xs'>Title</div>
                  <Input value={title} onChange={(event) => setTitle(event.target.value)} />
                </div>
                <div className='space-y-1'>
                  <div className='text-muted-foreground text-xs'>Description</div>
                  <Textarea
                    rows={4}
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                  />
                </div>
                <div className='grid gap-2 sm:grid-cols-2'>
                  <div className='space-y-1'>
                    <div className='text-muted-foreground text-xs'>Assignee</div>
                    <Input
                      value={assignee}
                      onChange={(event) => setAssignee(event.target.value)}
                      placeholder='Unassigned'
                    />
                  </div>
                  <div className='space-y-1'>
                    <div className='text-muted-foreground text-xs'>Due Date</div>
                    <Input
                      value={dueDate}
                      onChange={(event) => setDueDate(event.target.value)}
                      placeholder='YYYY-MM-DD'
                    />
                  </div>
                  <div className='space-y-1'>
                    <div className='text-muted-foreground text-xs'>Priority</div>
                    <Select
                      value={priority}
                      onValueChange={(value) => setPriority(value as KanbanTask['priority'])}
                    >
                      <SelectTrigger size='sm' className='w-full'>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='high'>High</SelectItem>
                        <SelectItem value='medium'>Medium</SelectItem>
                        <SelectItem value='low'>Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className='flex flex-wrap items-center justify-between gap-2 rounded-md border p-3'>
                  <div className='text-muted-foreground text-xs'>
                    Column: {COLUMN_TITLES[column]}
                  </div>
                  <Button
                    type='button'
                    variant='destructive'
                    size='sm'
                    isLoading={deleteTask.isPending}
                    disabled={isSaving}
                    onClick={() => deleteTask.mutate(task.id)}
                  >
                    Delete
                  </Button>
                </div>
                <div className='flex justify-end gap-2'>
                  <Button
                    type='submit'
                    size='sm'
                    isLoading={updateTask.isPending}
                    disabled={isSaving}
                  >
                    Save
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
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
