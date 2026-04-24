import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PortalPagination } from '@/app/portal/_components/portal-pagination';
import { QuotationApprovalButton } from '@/app/portal/_components/quotation-approval-button';
import { StatusBadge } from '@/app/portal/_components/status-badge';
import { getStatusTone } from '@/app/portal/_components/status-tone';
import { getPortalQuotationsPageData } from '@/lib/customer-portal';
import { formatPrice } from '@/lib/utils';

interface PortalQuotationsPageProps {
  searchParams: Promise<{
    page?: string;
  }>;
}

export default async function PortalQuotationsPage({ searchParams }: PortalQuotationsPageProps) {
  const { page } = await searchParams;
  const data = await getPortalQuotationsPageData(page);

  if (!data?.client) {
    return null;
  }

  return (
    <div className='space-y-6'>
      <div className='space-y-2'>
        <h1 className='text-3xl font-semibold tracking-tight'>Quotations</h1>
        <p className='text-muted-foreground max-w-3xl'>
          Review proposals, download documents, and approve any quotation that should move straight
          into invoicing.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Quotations</CardTitle>
          <CardDescription>Commercial documents issued to your account.</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          {data.items.length === 0 ? (
            <div className='text-muted-foreground text-sm'>No quotations available yet.</div>
          ) : (
            data.items.map((quotation) => (
              <div key={quotation.id} className='space-y-4 rounded-2xl border p-4'>
                <div className='flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between'>
                  <div className='space-y-1'>
                    <div className='font-medium'>{quotation.number}</div>
                    <div className='text-muted-foreground text-sm'>
                      {quotation.project?.name ?? 'Not converted to project yet'}
                    </div>
                    <div className='text-muted-foreground text-sm'>
                      Total {formatPrice(Number(quotation.total))}
                    </div>
                  </div>
                  <StatusBadge tone={getStatusTone(quotation.status)} value={quotation.status} />
                </div>
                <div className='flex flex-wrap gap-2'>
                  <Link
                    className='inline-flex rounded-lg border px-3 py-2 text-sm font-medium'
                    href={`/portal/quotations/${quotation.id}`}
                  >
                    Open document
                  </Link>
                  <Link
                    className='inline-flex rounded-lg border px-3 py-2 text-sm font-medium'
                    href={`/portal/quotations/${quotation.id}/download`}
                  >
                    Download PDF
                  </Link>
                </div>
                {quotation.status !== 'APPROVED' &&
                quotation.status !== 'REJECTED' &&
                quotation.status !== 'EXPIRED' ? (
                  <QuotationApprovalButton quotationId={quotation.id} />
                ) : null}
              </div>
            ))
          )}
          <PortalPagination basePath='/portal/quotations' pagination={data.pagination} />
        </CardContent>
      </Card>
    </div>
  );
}
