import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PortalPagination } from '@/app/portal/_components/portal-pagination';
import { Progress } from '@/components/ui/progress';
import { StatusBadge } from '@/app/portal/_components/status-badge';
import { getStatusTone } from '@/app/portal/_components/status-tone';
import { getPortalProjectsPageData } from '@/lib/customer-portal';
import { getProjectProgressSummary } from '@/lib/project-progress';
import { formatPrice } from '@/lib/utils';

interface PortalProjectsPageProps {
  searchParams: Promise<{
    page?: string;
  }>;
}

export default async function PortalProjectsPage({ searchParams }: PortalProjectsPageProps) {
  const { page } = await searchParams;
  const data = await getPortalProjectsPageData(page);

  if (!data?.client) {
    return null;
  }

  const client = data.client;

  return (
    <div className='space-y-6'>
      <div className='space-y-2'>
        <h1 className='text-3xl font-semibold tracking-tight'>Projects</h1>
        <p className='text-muted-foreground max-w-3xl'>
          Track project delivery, budgets, and the progress created from approved quotations or
          self-serve portal orders.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project Tracking</CardTitle>
          <CardDescription>
            All active and historical workstreams tied to your account.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          {data.items.length === 0 ? (
            <div className='text-muted-foreground text-sm'>No projects created yet.</div>
          ) : (
            data.items.map((project) => {
              const summary = getProjectProgressSummary({
                id: project.id,
                name: project.name,
                clientName: client.company ?? client.name,
                status: project.status,
                startDate: project.startDate?.toISOString() ?? null,
                endDate: project.endDate?.toISOString() ?? null,
                quotationId: project.quotationId,
                budget: project.budget ? Number(project.budget) : null
              });

              return (
                <div key={project.id} className='space-y-4 rounded-2xl border p-4'>
                  <div className='flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between'>
                    <div className='space-y-1'>
                      <div className='font-medium'>{project.name}</div>
                      <div className='text-muted-foreground text-sm'>
                        {summary.phase} · Budget{' '}
                        {project.budget ? formatPrice(Number(project.budget)) : 'not set'}
                      </div>
                    </div>
                    <StatusBadge tone={getStatusTone(project.status)} value={project.status} />
                  </div>
                  <div className='space-y-2'>
                    <div className='flex items-center justify-between text-sm'>
                      <span className='text-muted-foreground'>Delivery progress</span>
                      <span className='font-medium'>{summary.progress}%</span>
                    </div>
                    <Progress value={summary.progress} />
                    <div className='text-muted-foreground text-xs'>{summary.nextStep}</div>
                  </div>
                  <Link
                    className='inline-flex rounded-lg border px-3 py-2 text-sm font-medium'
                    href={`/portal/projects/${project.id}`}
                  >
                    Open project
                  </Link>
                </div>
              );
            })
          )}
          <PortalPagination basePath='/portal/projects' pagination={data.pagination} />
        </CardContent>
      </Card>
    </div>
  );
}
