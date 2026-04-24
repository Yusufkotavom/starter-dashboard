import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { fakeQuotations } from '@/constants/mock-api-quotations';
import { fakeInvoices } from '@/constants/mock-api-invoices';
import { formatPrice } from '@/lib/utils';

export function AreaGraph() {
  const approvedPipeline = fakeQuotations.records
    .filter((item) => item.status === 'APPROVED')
    .reduce((sum, item) => sum + item.total, 0);
  const sentPipeline = fakeQuotations.records
    .filter((item) => item.status === 'SENT')
    .reduce((sum, item) => sum + item.total, 0);
  const receivables = fakeInvoices.records
    .filter(
      (item) => item.status === 'SENT' || item.status === 'PARTIAL' || item.status === 'OVERDUE'
    )
    .reduce((sum, item) => sum + item.total, 0);

  const rows = [
    {
      label: 'Approved quotations',
      value: formatPrice(approvedPipeline),
      caption: 'Ready to convert or already feeding delivery.'
    },
    {
      label: 'Sent quotations',
      value: formatPrice(sentPipeline),
      caption: 'Pipeline waiting on client decision.'
    },
    {
      label: 'Outstanding receivables',
      value: formatPrice(receivables),
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
