import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { prisma } from '@/lib/prisma';

export async function PieGraph() {
  const invoices = await prisma.invoice.findMany({ select: { status: true } });
  const statusBreakdown = ['DRAFT', 'SENT', 'PAID', 'PARTIAL', 'OVERDUE', 'CANCELLED'].map(
    (status) => ({
      status,
      count: invoices.filter((item) => item.status === status).length
    })
  );
  const total = statusBreakdown.reduce((sum, item) => sum + item.count, 0) || 1;

  return (
    <Card className='flex h-full flex-col'>
      <CardHeader className='pb-0'>
        <CardTitle>Invoice Status Distribution</CardTitle>
        <CardDescription>How current billing records are distributed.</CardDescription>
      </CardHeader>
      <CardContent className='flex flex-1 flex-col justify-center gap-4 pb-0'>
        {statusBreakdown.map((item) => (
          <div key={item.status} className='space-y-2'>
            <div className='flex items-center justify-between text-sm'>
              <span className='font-medium'>{item.status}</span>
              <span className='text-muted-foreground'>
                {item.count} invoices ({Math.round((item.count / total) * 100)}%)
              </span>
            </div>
            <div className='bg-muted h-2 rounded-full'>
              <div
                className='bg-primary h-2 rounded-full'
                style={{ width: `${(item.count / total) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
