import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/app/portal/_components/status-badge';
import { formatPortalDate, getPortalQuotationDocument } from '@/lib/customer-portal';
import { formatPrice } from '@/lib/utils';

interface PortalQuotationPageProps {
  params: Promise<{
    quotationId: string;
  }>;
}

export default async function PortalQuotationPage({ params }: PortalQuotationPageProps) {
  const { quotationId } = await params;
  const quotation = await getPortalQuotationDocument(Number(quotationId));

  if (!quotation) {
    notFound();
  }

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between'>
        <div className='space-y-1'>
          <h1 className='text-3xl font-semibold tracking-tight'>{quotation.number}</h1>
          <p className='text-muted-foreground'>
            Quotation document for {quotation.client.company ?? quotation.client.name}
          </p>
        </div>
        <div className='flex flex-wrap gap-2'>
          <StatusBadge value={quotation.status} />
          <Link
            className='inline-flex rounded-lg border px-3 py-2 text-sm font-medium'
            href={`/portal/quotations/${quotation.id}/download`}
          >
            Download
          </Link>
        </div>
      </div>

      <div className='grid gap-6 xl:grid-cols-[2fr_1fr]'>
        <Card>
          <CardHeader>
            <CardTitle>Line items</CardTitle>
            <CardDescription>Services and amounts included in this quotation.</CardDescription>
          </CardHeader>
          <CardContent className='space-y-3'>
            {quotation.items.map((item) => (
              <div key={item.id} className='rounded-xl border p-4'>
                <div className='flex items-start justify-between gap-4'>
                  <div>
                    <div className='font-medium'>{item.description}</div>
                    <div className='text-muted-foreground mt-1 text-sm'>
                      {item.product?.name ?? 'Custom line item'}
                    </div>
                  </div>
                  <div className='text-right'>
                    <div className='font-medium'>{formatPrice(Number(item.amount))}</div>
                    <div className='text-muted-foreground mt-1 text-sm'>
                      Qty {Number(item.qty).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
            <CardDescription>Commercial details and validity.</CardDescription>
          </CardHeader>
          <CardContent className='space-y-3 text-sm'>
            <div className='flex items-center justify-between gap-4'>
              <span className='text-muted-foreground'>Created</span>
              <span>{formatPortalDate(quotation.createdAt)}</span>
            </div>
            <div className='flex items-center justify-between gap-4'>
              <span className='text-muted-foreground'>Valid until</span>
              <span>{formatPortalDate(quotation.validUntil)}</span>
            </div>
            <div className='flex items-center justify-between gap-4'>
              <span className='text-muted-foreground'>Subtotal</span>
              <span>{formatPrice(Number(quotation.subtotal))}</span>
            </div>
            <div className='flex items-center justify-between gap-4'>
              <span className='text-muted-foreground'>Tax</span>
              <span>{formatPrice(Number(quotation.tax))}</span>
            </div>
            <div className='flex items-center justify-between gap-4 border-t pt-3 font-medium'>
              <span>Total</span>
              <span>{formatPrice(Number(quotation.total))}</span>
            </div>
            {quotation.notes ? (
              <div className='rounded-xl border bg-muted/30 p-3'>
                <div className='mb-1 font-medium'>Notes</div>
                <div className='text-muted-foreground whitespace-pre-wrap'>{quotation.notes}</div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
