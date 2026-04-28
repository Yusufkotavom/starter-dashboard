'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { createKanbanTaskMutation } from '../api/mutations';
import type { KanbanArtifactType } from '../api/types';
import { apiClient } from '@/lib/api-client';

const artifactTypeOptions: Array<{ value: KanbanArtifactType; label: string }> = [
  { value: 'task', label: 'Task' },
  { value: 'masterplan', label: 'Masterplan' },
  { value: 'agent_md', label: 'agent.md' },
  { value: 'readme', label: 'README' },
  { value: 'doc', label: 'Document' },
  { value: 'note', label: 'Note' }
];

interface NewTaskDialogProps {
  projectId?: number;
}

export default function NewTaskDialog({ projectId }: NewTaskDialogProps) {
  const createTask = useMutation(createKanbanTaskMutation);
  const { data: docsData } = useQuery({
    queryKey: ['docs', 'kanban', projectId ?? 'global'],
    queryFn: async () => {
      const query = projectId ? `?projectId=${projectId}` : '';
      return apiClient<{
        items: Array<{ id: number; title: string; type: string; projectId: number | null }>;
      }>(`/docs${query}`);
    }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = e.currentTarget;
    const formData = new FormData(form);
    const { title, description, artifactType, artifactPath, docId, assignee, priority } =
      Object.fromEntries(formData);

    if (typeof title !== 'string') return;
    createTask.mutate({
      projectId,
      title,
      description: typeof description === 'string' ? description : undefined,
      artifactType:
        artifactType === 'masterplan' ||
        artifactType === 'agent_md' ||
        artifactType === 'readme' ||
        artifactType === 'doc' ||
        artifactType === 'note' ||
        artifactType === 'task'
          ? artifactType
          : 'task',
      artifactPath: typeof artifactPath === 'string' ? artifactPath : undefined,
      docId: typeof docId === 'string' && docId !== 'none' ? Number(docId) : undefined,
      assignee: typeof assignee === 'string' ? assignee : undefined,
      priority:
        priority === 'high' || priority === 'medium' || priority === 'low' ? priority : 'medium'
    });
    form.reset();
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant='secondary' size='sm'>
          + Add New Task
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-[520px]'>
        <DialogHeader>
          <DialogTitle>Add New Task</DialogTitle>
          <DialogDescription>What do you want to get done today?</DialogDescription>
        </DialogHeader>
        <form id='task-form' className='grid gap-4 py-4' onSubmit={handleSubmit}>
          <div className='grid grid-cols-4 items-center gap-4'>
            <Input id='title' name='title' placeholder='Task title...' className='col-span-4' />
          </div>
          <div className='grid grid-cols-4 items-center gap-4'>
            <Textarea
              id='description'
              name='description'
              placeholder='Description / context / acceptance criteria...'
              className='col-span-4'
            />
          </div>
          <div className='grid grid-cols-4 items-center gap-4'>
            <Select name='artifactType' defaultValue='task'>
              <SelectTrigger className='col-span-4 w-full'>
                <SelectValue placeholder='Type' />
              </SelectTrigger>
              <SelectContent>
                {artifactTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className='grid grid-cols-4 items-center gap-4'>
            <Input
              id='artifactPath'
              name='artifactPath'
              placeholder='Path / ref (example: docs/masterplan.md)'
              className='col-span-4'
            />
          </div>
          <div className='grid grid-cols-4 items-center gap-4'>
            <Select name='docId' defaultValue='none'>
              <SelectTrigger className='col-span-4 w-full'>
                <SelectValue placeholder='Link to doc (optional)' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='none'>No linked doc</SelectItem>
                {(docsData?.items ?? []).map((doc) => (
                  <SelectItem key={doc.id} value={String(doc.id)}>
                    {doc.title} ({doc.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className='grid grid-cols-4 items-center gap-4'>
            <Input
              id='assignee'
              name='assignee'
              placeholder='Assignee (optional)'
              className='col-span-4'
            />
          </div>
          <div className='grid grid-cols-4 items-center gap-4'>
            <Select name='priority' defaultValue='medium'>
              <SelectTrigger className='col-span-4 w-full'>
                <SelectValue placeholder='Priority' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='high'>High priority</SelectItem>
                <SelectItem value='medium'>Medium priority</SelectItem>
                <SelectItem value='low'>Low priority</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </form>
        <DialogFooter>
          <DialogTrigger asChild>
            <Button type='submit' size='sm' form='task-form'>
              Add Task
            </Button>
          </DialogTrigger>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
