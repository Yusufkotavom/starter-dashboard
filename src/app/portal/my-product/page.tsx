import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PortalPagination } from '@/app/portal/_components/portal-pagination';
import { getPortalDigitalAccessPageData } from '@/lib/customer-portal';

interface PortalMyProductPageProps {
  searchParams: Promise<{
    page?: string;
  }>;
}

export default async function PortalMyProductPage({ searchParams }: PortalMyProductPageProps) {
  const { page } = await searchParams;
  const data = await getPortalDigitalAccessPageData(page);

  if (!data?.client) {
    return null;
  }

  return (
    <div className='space-y-6'>
      <div className='space-y-1'>
        <h1 className='text-3xl font-semibold tracking-tight'>My Product</h1>
        <p className='text-muted-foreground'>
          All products and services tied to your invoices, quotations, and recurring subscriptions.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Owned Products & Services</CardTitle>
          <CardDescription>
            Open product detail, related source documents, and digital delivery links.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          {data.items.length === 0 ? (
            <div className='text-muted-foreground text-sm'>
              No products or services linked to your account yet.
            </div>
          ) : (
            data.items.map((item) => (
              <div
                key={item.key}
                className='flex flex-col gap-3 rounded-xl border p-4 md:flex-row md:items-center md:justify-between'
              >
                <div className='space-y-1'>
                  <div className='font-medium'>
                    {item.productId ? (
                      <Link
                        href={`/portal/my-product/${item.productId}`}
                        className='underline underline-offset-4'
                      >
                        {item.title}
                      </Link>
                    ) : (
                      item.title
                    )}
                  </div>
                  <div className='text-muted-foreground text-sm'>{item.subtitle}</div>
                  <Link
                    href={item.sourcePath}
                    className='text-muted-foreground text-sm underline underline-offset-4'
                  >
                    Source {item.sourceType}: {item.sourceNumber}
                  </Link>
                </div>
                {item.deliveryUrl ? (
                  <Link
                    href={item.deliveryUrl}
                    target='_blank'
                    rel='noreferrer'
                    className='inline-flex rounded-lg border px-3 py-2 text-sm font-medium'
                  >
                    Open Access
                  </Link>
                ) : (
                  <span className='text-muted-foreground text-sm'>No digital link</span>
                )}
              </div>
            ))
          )}
          <PortalPagination basePath='/portal/my-product' pagination={data.pagination} />
        </CardContent>
      </Card>
    </div>
  );
}
