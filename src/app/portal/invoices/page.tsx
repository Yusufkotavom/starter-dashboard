import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PortalPagination } from '@/app/portal/_components/portal-pagination';
import { PaymentProofForm } from '@/app/portal/_components/payment-proof-form';
import { StatusBadge } from '@/app/portal/_components/status-badge';
import { getStatusTone } from '@/app/portal/_components/status-tone';
import { getPortalInvoicesPageData } from '@/lib/customer-portal';
import { formatPrice } from '@/lib/utils';

interface PortalInvoicesPageProps {
  searchParams: Promise<{
    page?: string;
  }>;
}

export default async function PortalInvoicesPage({ searchParams }: PortalInvoicesPageProps) {
  const { page } = await searchParams;
  const data = await getPortalInvoicesPageData(page);

  if (!data?.client) {
    return null;
  }

  return (
    <div className='space-y-6'>
      <div className='space-y-2'>
        <h1 className='text-3xl font-semibold tracking-tight'>Invoices</h1>
        <p className='text-muted-foreground max-w-3xl'>
          Open billing documents, continue to payment, and upload payment proof from one place.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Invoices</CardTitle>
          <CardDescription>Documents issued to your account, newest first.</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          {data.items.length === 0 ? (
            <div className='text-muted-foreground text-sm'>No invoices issued yet.</div>
          ) : (
            data.items.map((invoice) => {
              const paidAmount = invoice.payments.reduce(
                (sum, payment) => sum + Number(payment.amount),
                0
              );
              const balanceDue = Math.max(Number(invoice.total) - paidAmount, 0);

              return (
                <div key={invoice.id} className='space-y-4 rounded-2xl border p-4'>
                  <div className='flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between'>
                    <div className='space-y-1'>
                      <div className='font-medium'>{invoice.number}</div>
                      <div className='text-muted-foreground text-sm'>
                        {invoice.project?.name ??
                          invoice.subscription?.plan.name ??
                          'General billing'}
                      </div>
                      <div className='text-muted-foreground text-sm'>
                        Total {formatPrice(Number(invoice.total))} · Balance{' '}
                        {formatPrice(balanceDue)}
                      </div>
                    </div>
                    <StatusBadge tone={getStatusTone(invoice.status)} value={invoice.status} />
                  </div>
                  <div className='flex flex-wrap gap-2'>
                    <Link
                      className='inline-flex rounded-lg border px-3 py-2 text-sm font-medium'
                      href={`/portal/invoices/${invoice.id}`}
                    >
                      Open invoice
                    </Link>
                    <Link
                      className='inline-flex rounded-lg border px-3 py-2 text-sm font-medium'
                      href={`/portal/invoices/${invoice.id}/download`}
                    >
                      Download PDF
                    </Link>
                  </div>
                  {balanceDue > 0 ? (
                    <PaymentProofForm
                      invoiceId={invoice.id}
                      invoiceNumber={invoice.number}
                      suggestedAmount={balanceDue}
                    />
                  ) : null}
                </div>
              );
            })
          )}
          <PortalPagination basePath='/portal/invoices' pagination={data.pagination} />
        </CardContent>
      </Card>
    </div>
  );
}
