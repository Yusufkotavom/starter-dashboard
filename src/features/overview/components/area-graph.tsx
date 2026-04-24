import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { prisma } from '@/lib/prisma';
import { getAgencyMetrics } from '@/lib/agency';
import { formatPrice } from '@/lib/utils';

export async function AreaGraph() {
  const metrics = await getAgencyMetrics(prisma);

  const rows = [
    {
      label: 'Approved quotations',
      value: formatPrice(metrics.approvedPipeline),
      caption: 'Ready to convert or already feeding delivery.'
    },
    {
      label: 'Sent quotations',
      value: formatPrice(metrics.sentPipeline),
      caption: 'Pipeline waiting on client decision.'
    },
    {
      label: 'Outstanding receivables',
      value: formatPrice(metrics.outstandingInvoices),
      caption: 'Invoice value still pending collection.'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pipeline Health</CardTitle>
        <CardDescription>Commercial flow from proposal to billed work.</CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        {rows.map((row) => (
          <div key={row.label} className='rounded-lg border p-4'>
            <div className='text-muted-foreground text-sm'>{row.label}</div>
            <div className='mt-1 text-2xl font-semibold'>{row.value}</div>
            <div className='text-muted-foreground mt-1 text-sm'>{row.caption}</div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
