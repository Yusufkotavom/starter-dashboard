import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PortalPagination } from '@/app/portal/_components/portal-pagination';
import { getPortalDigitalAccessPageData } from '@/lib/customer-portal';

interface PortalDigitalAccessPageProps {
  searchParams: Promise<{
    page?: string;
  }>;
}

export default async function PortalDigitalAccessPage({
  searchParams
}: PortalDigitalAccessPageProps) {
  const { page } = await searchParams;
  const data = await getPortalDigitalAccessPageData(page);

  if (!data?.client) {
    return null;
  }

  return (
    <div className='space-y-6'>
      <div className='space-y-1'>
        <h1 className='text-3xl font-semibold tracking-tight'>Digital Access</h1>
        <p className='text-muted-foreground'>
          Dedicated page for digital products, portals, and delivery links tied to your invoices.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Available Items</CardTitle>
          <CardDescription>
            Open your digital products without hunting through invoice detail pages.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          {data.items.length === 0 ? (
            <div className='text-muted-foreground text-sm'>
              No digital items have been delivered to your account yet.
            </div>
          ) : (
            data.items.map((item) => (
              <div
                key={item.key}
                className='flex flex-col gap-3 rounded-xl border p-4 md:flex-row md:items-center md:justify-between'
              >
                <div className='space-y-1'>
                  <div className='font-medium'>{item.title}</div>
                  <div className='text-muted-foreground text-sm'>{item.subtitle}</div>
                  <Link
                    href={`/portal/invoices/${item.invoiceId}`}
                    className='text-muted-foreground text-sm underline underline-offset-4'
                  >
                    Source invoice: {item.invoiceNumber}
                  </Link>
                </div>
                <Link
                  href={item.deliveryUrl}
                  target='_blank'
                  rel='noreferrer'
                  className='inline-flex rounded-lg border px-3 py-2 text-sm font-medium'
                >
                  Open Access
                </Link>
              </div>
            ))
          )}
          <PortalPagination basePath='/portal/digital-access' pagination={data.pagination} />
        </CardContent>
      </Card>
    </div>
  );
}
