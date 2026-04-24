import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { StatusBadge } from '@/app/portal/_components/status-badge';
import { formatPortalDate, getPortalProjectDocument } from '@/lib/customer-portal';
import { getProjectProgressSummary } from '@/lib/project-progress';
import { formatPrice } from '@/lib/utils';

function getStatusTone(value: string): 'default' | 'success' | 'warning' | 'danger' {
  if (['PAID', 'APPROVED', 'ACTIVE', 'COMPLETED'].includes(value)) return 'success';
  if (['OVERDUE', 'REJECTED', 'CANCELLED', 'EXPIRED'].includes(value)) return 'danger';
  if (['PARTIAL', 'PAUSED', 'SENT'].includes(value)) return 'warning';
  return 'default';
}

type PageProps = {
  params: Promise<{ projectId: string }>;
};

export default async function PortalProjectPage(props: PageProps) {
  const params = await props.params;
  const project = await getPortalProjectDocument(Number(params.projectId));

  if (!project) {
    notFound();
  }

  const summary = getProjectProgressSummary({
    id: project.id,
    name: project.name,
    clientName: project.client.company ?? project.client.name,
    status: project.status,
    startDate: project.startDate?.toISOString() ?? null,
    endDate: project.endDate?.toISOString() ?? null,
    quotationId: project.quotationId,
    budget: project.budget ? Number(project.budget) : null
  });

  const totalBilled = project.invoices.reduce((sum, invoice) => sum + Number(invoice.total), 0);
  const totalPaid = project.invoices.reduce(
    (sum, invoice) =>
      sum +
      invoice.payments.reduce((paymentSum, payment) => paymentSum + Number(payment.amount), 0),
    0
  );
  const openInvoices = project.invoices.filter((invoice) =>
    ['SENT', 'PARTIAL', 'OVERDUE'].includes(invoice.status)
  );

  return (
    <div className='space-y-8'>
      <div className='flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
        <div className='space-y-2'>
          <Link href='/portal' className='text-muted-foreground inline-flex items-center text-sm'>
            Back to portal
          </Link>
          <h1 className='text-3xl font-semibold tracking-tight'>{project.name}</h1>
          <p className='text-muted-foreground max-w-3xl'>
            This page reflects the current delivery phase and billing status for your project.
            Operational task updates are managed by the agency team from the internal board.
          </p>
        </div>
        <StatusBadge tone={getStatusTone(project.status)} value={project.status} />
      </div>

      <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
        <Card>
          <CardHeader className='pb-2'>
            <CardDescription>Delivery Progress</CardDescription>
            <CardTitle className='text-3xl'>{summary.progress}%</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardDescription>Current Phase</CardDescription>
            <CardTitle className='text-3xl'>{summary.phase}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardDescription>Open Invoices</CardDescription>
            <CardTitle className='text-3xl'>{openInvoices.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardDescription>Recurring Services</CardDescription>
            <CardTitle className='text-3xl'>{project.subscriptions.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className='grid gap-6 xl:grid-cols-[1.2fr_0.8fr]'>
        <Card>
          <CardHeader>
            <CardTitle>Progress Overview</CardTitle>
            <CardDescription>{summary.nextStep}</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='space-y-2'>
              <div className='flex items-center justify-between text-sm'>
                <span className='text-muted-foreground'>Estimated completion</span>
                <span className='font-medium'>{summary.progress}%</span>
              </div>
              <Progress value={summary.progress} />
            </div>
            <div className='grid gap-3 md:grid-cols-2'>
              <div className='rounded-xl border p-4'>
                <div className='text-muted-foreground text-sm'>Kickoff Date</div>
                <div className='mt-1 font-medium'>{formatPortalDate(project.startDate)}</div>
              </div>
              <div className='rounded-xl border p-4'>
                <div className='text-muted-foreground text-sm'>Target Delivery</div>
                <div className='mt-1 font-medium'>{formatPortalDate(project.endDate)}</div>
              </div>
              <div className='rounded-xl border p-4'>
                <div className='text-muted-foreground text-sm'>Project Budget</div>
                <div className='mt-1 font-medium'>
                  {project.budget ? formatPrice(Number(project.budget)) : 'Not set'}
                </div>
              </div>
              <div className='rounded-xl border p-4'>
                <div className='text-muted-foreground text-sm'>Source Quotation</div>
                <div className='mt-1 font-medium'>
                  {project.quotation?.number ? (
                    <Link
                      href={`/portal/quotations/${project.quotation.id}`}
                      className='hover:underline'
                    >
                      {project.quotation.number}
                    </Link>
                  ) : (
                    'Not linked'
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Billing Snapshot</CardTitle>
            <CardDescription>Commercial documents tied to this delivery.</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='rounded-xl border p-4'>
              <div className='text-muted-foreground text-sm'>Total billed</div>
              <div className='mt-1 text-2xl font-semibold'>{formatPrice(totalBilled)}</div>
            </div>
            <div className='rounded-xl border p-4'>
              <div className='text-muted-foreground text-sm'>Total paid</div>
              <div className='mt-1 text-2xl font-semibold'>{formatPrice(totalPaid)}</div>
            </div>
            <div className='rounded-xl border p-4'>
              <div className='text-muted-foreground text-sm'>Outstanding balance</div>
              <div className='mt-1 text-2xl font-semibold'>
                {formatPrice(Math.max(totalBilled - totalPaid, 0))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className='grid gap-6 xl:grid-cols-2'>
        <Card>
          <CardHeader>
            <CardTitle>Invoices</CardTitle>
            <CardDescription>Documents issued for this project.</CardDescription>
          </CardHeader>
          <CardContent className='space-y-3'>
            {project.invoices.length === 0 ? (
              <div className='text-muted-foreground text-sm'>No invoices for this project yet.</div>
            ) : (
              project.invoices.map((invoice) => {
                const paidAmount = invoice.payments.reduce(
                  (sum, payment) => sum + Number(payment.amount),
                  0
                );

                return (
                  <div key={invoice.id} className='rounded-xl border p-4'>
                    <div className='flex items-start justify-between gap-4'>
                      <div>
                        <Link
                          href={`/portal/invoices/${invoice.id}`}
                          className='font-medium hover:underline'
                        >
                          {invoice.number}
                        </Link>
                        <div className='text-muted-foreground mt-1 text-sm'>
                          Total {formatPrice(Number(invoice.total))} · Paid{' '}
                          {formatPrice(paidAmount)}
                        </div>
                      </div>
                      <StatusBadge tone={getStatusTone(invoice.status)} value={invoice.status} />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recurring Services</CardTitle>
            <CardDescription>Subscriptions still attached to this project.</CardDescription>
          </CardHeader>
          <CardContent className='space-y-3'>
            {project.subscriptions.length === 0 ? (
              <div className='text-muted-foreground text-sm'>
                No recurring services are linked to this project.
              </div>
            ) : (
              project.subscriptions.map((subscription) => (
                <div key={subscription.id} className='rounded-xl border p-4'>
                  <div className='flex items-start justify-between gap-4'>
                    <div>
                      <div className='font-medium'>{subscription.plan.name}</div>
                      <div className='text-muted-foreground mt-1 text-sm'>
                        Next billing {formatPortalDate(subscription.nextBillingDate)}
                      </div>
                    </div>
                    <StatusBadge
                      tone={getStatusTone(subscription.status)}
                      value={subscription.status}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
