import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import PageContainer from '@/components/layout/page-container';
import { fakeClients } from '@/constants/mock-api-clients';
import { fakeProjects } from '@/constants/mock-api-projects';
import { fakeQuotations } from '@/constants/mock-api-quotations';
import { fakeInvoices } from '@/constants/mock-api-invoices';
import { fakePayments } from '@/constants/mock-api-payments';
import { fakeExpenses } from '@/constants/mock-api-expenses';
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

export default function ReportsPage() {
  const approvedPipeline = fakeQuotations.records
    .filter((item) => item.status === 'APPROVED')
    .reduce((sum, item) => sum + item.total, 0);
  const activeProjects = fakeProjects.records.filter((item) => item.status === 'ACTIVE').length;
  const outstandingInvoices = fakeInvoices.records
    .filter(
      (item) => item.status === 'SENT' || item.status === 'OVERDUE' || item.status === 'PARTIAL'
    )
    .reduce((sum, item) => sum + item.total, 0);
  const cashIn = fakePayments.records.reduce((sum, item) => sum + item.amount, 0);
  const costOut = fakeExpenses.records.reduce((sum, item) => sum + item.amount, 0);
  const grossSpread = cashIn - costOut;

  const recentInvoices = fakeInvoices.records
    .toSorted((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);
  const recentProjects = fakeProjects.records
    .toSorted((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 5);

  return (
    <PageContainer
      pageTitle='Reports'
      pageDescription='Monitor pipeline, delivery health, cash-in, and project profitability.'
    >
      <div className='space-y-6'>
        <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
          {metric(
            'Clients',
            String(fakeClients.records.length),
            'Total CRM records tracked in the agency dashboard.'
          )}
          {metric(
            'Approved Pipeline',
            formatPrice(approvedPipeline),
            'Value of quotations already approved and ready for delivery.'
          )}
          {metric(
            'Active Projects',
            String(activeProjects),
            'Current delivery workload in progress.'
          )}
          {metric(
            'Outstanding Invoices',
            formatPrice(outstandingInvoices),
            'Invoices still awaiting full collection.'
          )}
          {metric('Cash In', formatPrice(cashIn), 'Recorded payments received from clients.')}
          {metric(
            'Gross Spread',
            formatPrice(grossSpread),
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
