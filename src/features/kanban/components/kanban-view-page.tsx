import Link from 'next/link';
import { Icons } from '@/components/icons';
import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { KanbanBoard } from './kanban-board';
import NewTaskDialog from './new-task-dialog';

interface KanbanViewPageProps {
  context?: {
    projectId?: string;
    projectName?: string;
    clientName?: string;
    phase?: string;
    progress?: number;
  };
}

export default function KanbanViewPage({ context }: KanbanViewPageProps) {
  const hasProjectContext = !!context?.projectId || !!context?.projectName;

  return (
    <PageContainer
      pageTitle={hasProjectContext ? (context?.projectName ?? 'Project Board') : 'Kanban'}
      pageDescription={
        hasProjectContext
          ? `Track delivery tasks${context?.clientName ? ` for ${context.clientName}` : ''} from backlog to done.`
          : 'Manage tasks with drag and drop'
      }
      pageHeaderAction={
        <div className='flex items-center gap-2'>
          {context?.projectId ? (
            <Button asChild variant='outline'>
              <Link href={`/dashboard/projects/${context.projectId}`}>
                <Icons.chevronLeft className='mr-2 h-4 w-4' />
                Project
              </Link>
            </Button>
          ) : null}
          <NewTaskDialog />
        </div>
      }
    >
      {hasProjectContext ? (
        <div className='mb-6 rounded-2xl border bg-muted/20 p-4'>
          <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
            <div className='space-y-1'>
              <div className='text-sm font-medium'>
                {context?.phase ?? 'Execution'}
                {context?.clientName ? ` · ${context.clientName}` : ''}
              </div>
              <div className='text-muted-foreground text-sm'>
                Use this board as the working surface for task updates, progress tracking, and
                handoff.
              </div>
            </div>
            {typeof context?.progress === 'number' ? (
              <div className='w-full max-w-sm space-y-2'>
                <div className='flex items-center justify-between text-sm'>
                  <span className='text-muted-foreground'>Estimated delivery progress</span>
                  <span className='font-medium'>{context.progress}%</span>
                </div>
                <Progress value={context.progress} />
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <KanbanBoard />
    </PageContainer>
  );
}
