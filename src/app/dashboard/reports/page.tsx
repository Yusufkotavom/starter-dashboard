import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import PageContainer from '@/components/layout/page-container';
import { getAgencyMetrics, mapInvoiceRecord, mapProjectRecord } from '@/lib/agency';
import { prisma } from '@/lib/prisma';
import { formatPrice } from '@/lib/utils';

function metric(title: string, value: string, description: string) {
  return (
    <Card>
      <CardHeader className='pb-2'>
        <CardDescription>{title}</CardDescription>
        <CardTitle className='text-2xl'>{value}</CardTitle>
      </CardHeader>
      <CardContent className='text-muted-foreground text-sm'>{description}</CardContent>
    </Card>
  );
}

export const metadata = {
  title: 'Dashboard: Reports'
};

export default async function ReportsPage() {
  const metrics = await getAgencyMetrics(prisma);
  const [clientsCount, recentInvoices, recentProjects] = await Promise.all([
    prisma.client.count(),
    prisma.invoice
      .findMany({
        include: { client: true, project: true, payments: { select: { amount: true } } },
        orderBy: { createdAt: 'desc' },
        take: 5
      })
      .then((items) => items.map(mapInvoiceRecord)),
    prisma.project
      .findMany({
        include: { client: true, quotation: true },
        orderBy: { updatedAt: 'desc' },
        take: 5
      })
      .then((items) => items.map(mapProjectRecord))
  ]);

  return (
    <PageContainer
      pageTitle='Reports'
      pageDescription='Monitor pipeline, delivery health, cash-in, and project profitability.'
    >
      <div className='space-y-6'>
        <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
          {metric(
            'Clients',
            String(clientsCount),
            'Total CRM records tracked in the agency dashboard.'
          )}
          {metric(
            'Approved Pipeline',
            formatPrice(metrics.approvedPipeline),
            'Value of quotations already approved and ready for delivery.'
          )}
          {metric(
            'Active Projects',
            String(metrics.activeProjects),
            'Current delivery workload in progress.'
          )}
          {metric(
            'Outstanding Invoices',
            formatPrice(metrics.outstandingInvoices),
            'Invoices still awaiting full collection.'
          )}
          {metric(
            'Cash In',
            formatPrice(metrics.cashIn),
            'Recorded payments received from clients.'
          )}
          {metric(
            'Gross Spread',
            formatPrice(metrics.grossSpread),
            'Cash in minus recorded expenses across the demo dataset.'
          )}
        </div>

        <div className='grid gap-6 xl:grid-cols-2'>
          <Card>
            <CardHeader>
              <CardTitle>Recent Invoice Activity</CardTitle>
              <CardDescription>Latest billing records that affect receivables.</CardDescription>
            </CardHeader>
            <CardContent className='space-y-3'>
              {recentInvoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className='flex items-center justify-between gap-4 rounded-lg border p-3'
                >
                  <div>
                    <div className='font-medium'>{invoice.number}</div>
                    <div className='text-muted-foreground text-sm'>{invoice.clientName}</div>
                  </div>
                  <div className='text-right'>
                    <div className='font-medium'>{formatPrice(invoice.total)}</div>
                    <div className='text-muted-foreground text-sm'>{invoice.status}</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Project Pulse</CardTitle>
              <CardDescription>Recently updated delivery work for team review.</CardDescription>
            </CardHeader>
            <CardContent className='space-y-3'>
              {recentProjects.map((project) => (
                <div
                  key={project.id}
                  className='flex items-center justify-between gap-4 rounded-lg border p-3'
                >
                  <div>
                    <div className='font-medium'>{project.name}</div>
                    <div className='text-muted-foreground text-sm'>
                      {project.clientCompany ?? project.clientName}
                    </div>
                  </div>
                  <div className='text-right'>
                    <div className='font-medium'>{project.status}</div>
                    <div className='text-muted-foreground text-sm'>
                      {project.budget ? formatPrice(project.budget) : 'No budget'}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
