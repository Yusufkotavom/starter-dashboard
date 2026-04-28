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
  compact?: boolean;
}

function buildKanbanHref(context: KanbanViewPageProps['context'], compact: boolean) {
  const params = new URLSearchParams();

  if (context?.projectId) params.set('projectId', context.projectId);
  if (context?.projectName) params.set('project', context.projectName);
  if (context?.clientName) params.set('client', context.clientName);
  if (context?.phase) params.set('phase', context.phase);
  if (typeof context?.progress === 'number') params.set('progress', String(context.progress));
  if (compact) params.set('compact', '1');

  const query = params.toString();
  return query ? `/dashboard/kanban?${query}` : '/dashboard/kanban';
}

export default function KanbanViewPage({ context, compact = false }: KanbanViewPageProps) {
  const hasProjectContext = !!context?.projectId || !!context?.projectName;
  const normalHref = buildKanbanHref(context, false);
  const compactHref = buildKanbanHref(context, true);
  const toggleCompactHref = compact ? normalHref : compactHref;
  const toggleCompactLabel = compact ? 'Show header' : 'Kanban only';
  const toggleCompactIcon = compact ? Icons.minimize : Icons.maximize;
  const ToggleCompactIcon = toggleCompactIcon;

  return (
    <PageContainer
      compact={compact}
      pageTitle={
        compact
          ? undefined
          : hasProjectContext
            ? (context?.projectName ?? 'Project Board')
            : 'Kanban'
      }
      pageDescription={
        compact
          ? undefined
          : hasProjectContext
            ? `Track delivery tasks${context?.clientName ? ` for ${context.clientName}` : ''} from backlog to done.`
            : 'Manage tasks with drag and drop'
      }
      pageHeaderAction={
        <div className='flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto sm:flex-nowrap'>
          <Button asChild variant='outline' size='sm' className='w-full sm:w-auto'>
            <Link href={toggleCompactHref}>
              <ToggleCompactIcon className='mr-2 h-4 w-4' />
              {toggleCompactLabel}
            </Link>
          </Button>
          {context?.projectId && !compact ? (
            <Button asChild variant='outline' size='sm' className='w-full sm:w-auto'>
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
      {hasProjectContext && !compact ? (
        <div className='mb-4 rounded-xl border bg-muted/20 p-4 md:mb-6'>
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

      <KanbanBoard fullScreen={compact} />
    </PageContainer>
  );
}
