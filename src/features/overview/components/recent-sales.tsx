import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { prisma } from '@/lib/prisma';
import { mapPaymentRecord } from '@/lib/agency';
import { formatPrice } from '@/lib/utils';

export async function RecentSales() {
  const recentPayments = (
    await prisma.payment.findMany({
      include: { invoice: { include: { client: true } } },
      orderBy: { paidAt: 'desc' },
      take: 5
    })
  ).map(mapPaymentRecord);

  return (
    <Card className='h-full'>
      <CardHeader>
        <CardTitle>Recent Payments</CardTitle>
        <CardDescription>Latest client cash-in activity across invoices.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className='space-y-8'>
          {recentPayments.map((payment) => (
            <div key={payment.id} className='flex items-center'>
              <div className='bg-muted flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium'>
                {payment.clientName
                  .split(' ')
                  .slice(0, 2)
                  .map((item) => item[0])
                  .join('')}
              </div>
              <div className='ml-4 space-y-1'>
                <p className='text-sm leading-none font-medium'>{payment.clientName}</p>
                <p className='text-muted-foreground text-sm'>{payment.invoiceNumber}</p>
              </div>
              <div className='ml-auto text-right'>
                <div className='font-medium'>{formatPrice(payment.amount)}</div>
                <div className='text-muted-foreground text-xs'>
                  {new Date(payment.paidAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
