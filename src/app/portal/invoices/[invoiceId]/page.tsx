import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/app/portal/_components/status-badge';
import { formatPortalDate, getPortalInvoiceDocument } from '@/lib/customer-portal';
import { formatPrice } from '@/lib/utils';

interface PortalInvoicePageProps {
  params: Promise<{
    invoiceId: string;
  }>;
}

export default async function PortalInvoicePage({ params }: PortalInvoicePageProps) {
  const { invoiceId } = await params;
  const invoice = await getPortalInvoiceDocument(Number(invoiceId));

  if (!invoice) {
    notFound();
  }

  const paidAmount = invoice.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
  const balanceDue = Math.max(Number(invoice.total) - paidAmount, 0);
  const items =
    invoice.project?.quotation?.items ??
    (invoice.subscription?.plan.service
      ? [
          {
            id: 0,
            description: invoice.subscription.plan.name,
            product: invoice.subscription.plan.service,
            qty: 1,
            amount: invoice.total
          }
        ]
      : []);

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between'>
        <div className='space-y-1'>
          <h1 className='text-3xl font-semibold tracking-tight'>{invoice.number}</h1>
          <p className='text-muted-foreground'>
            Invoice document for {invoice.client.company ?? invoice.client.name}
          </p>
        </div>
        <div className='flex flex-wrap gap-2'>
          <StatusBadge value={invoice.status} />
          <Link
            className='inline-flex rounded-lg border px-3 py-2 text-sm font-medium'
            href={`/portal/invoices/${invoice.id}/download`}
          >
            Download
          </Link>
        </div>
      </div>

      <div className='grid gap-6 xl:grid-cols-[2fr_1fr]'>
        <Card>
          <CardHeader>
            <CardTitle>Billing lines</CardTitle>
            <CardDescription>Services and billed amounts included in this invoice.</CardDescription>
          </CardHeader>
          <CardContent className='space-y-3'>
            {items.length === 0 ? (
              <div className='text-muted-foreground text-sm'>No detailed items available.</div>
            ) : (
              items.map((item) => (
                <div key={item.id} className='rounded-xl border p-4'>
                  <div className='flex items-start justify-between gap-4'>
                    <div>
                      <div className='font-medium'>{item.description}</div>
                      <div className='text-muted-foreground mt-1 text-sm'>
                        {'product' in item
                          ? (item.product?.name ?? 'General billing')
                          : 'General billing'}
                      </div>
                    </div>
                    <div className='text-right'>
                      <div className='font-medium'>{formatPrice(Number(item.amount))}</div>
                      <div className='text-muted-foreground mt-1 text-sm'>
                        Qty {'qty' in item ? Number(item.qty).toFixed(2) : '1.00'}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
            <CardDescription>Payment and due-date details.</CardDescription>
          </CardHeader>
          <CardContent className='space-y-3 text-sm'>
            <div className='flex items-center justify-between gap-4'>
              <span className='text-muted-foreground'>Created</span>
              <span>{formatPortalDate(invoice.createdAt)}</span>
            </div>
            <div className='flex items-center justify-between gap-4'>
              <span className='text-muted-foreground'>Due date</span>
              <span>{formatPortalDate(invoice.dueDate)}</span>
            </div>
            <div className='flex items-center justify-between gap-4'>
              <span className='text-muted-foreground'>Subtotal</span>
              <span>{formatPrice(Number(invoice.subtotal))}</span>
            </div>
            <div className='flex items-center justify-between gap-4'>
              <span className='text-muted-foreground'>Paid</span>
              <span>{formatPrice(paidAmount)}</span>
            </div>
            <div className='flex items-center justify-between gap-4 border-t pt-3 font-medium'>
              <span>Balance due</span>
              <span>{formatPrice(balanceDue)}</span>
            </div>
            {invoice.notes ? (
              <div className='rounded-xl border bg-muted/30 p-3'>
                <div className='mb-1 font-medium'>Notes</div>
                <div className='text-muted-foreground whitespace-pre-wrap'>{invoice.notes}</div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
