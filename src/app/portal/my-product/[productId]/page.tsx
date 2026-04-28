import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getPortalMyProductDetail } from '@/lib/customer-portal';
import { formatPrice } from '@/lib/utils';

interface PortalMyProductDetailPageProps {
  params: Promise<{
    productId: string;
  }>;
}

export default async function PortalMyProductDetailPage({
  params
}: PortalMyProductDetailPageProps) {
  const { productId } = await params;
  const detail = await getPortalMyProductDetail(productId);

  if (!detail) {
    notFound();
  }

  return (
    <div className='space-y-6'>
      <div className='space-y-2'>
        <h1 className='text-3xl font-semibold tracking-tight'>{detail.product.name}</h1>
        <p className='text-muted-foreground max-w-3xl'>{detail.product.description}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Product Detail</CardTitle>
          <CardDescription>Summary of your product or service ownership.</CardDescription>
        </CardHeader>
        <CardContent className='grid gap-3 md:grid-cols-2'>
          <div className='rounded-xl border p-4'>
            <div className='text-muted-foreground text-sm'>Type</div>
            <div className='mt-1 font-medium'>{detail.product.type}</div>
          </div>
          <div className='rounded-xl border p-4'>
            <div className='text-muted-foreground text-sm'>Price</div>
            <div className='mt-1 font-medium'>
              {formatPrice(detail.product.price)} / {detail.product.unit}
            </div>
          </div>
          <div className='rounded-xl border p-4'>
            <div className='text-muted-foreground text-sm'>Delivery Type</div>
            <div className='mt-2'>
              <Badge variant={detail.product.isDigital ? 'default' : 'secondary'}>
                {detail.product.isDigital ? 'Digital Access' : 'Manual Delivery'}
              </Badge>
            </div>
          </div>
          <div className='rounded-xl border p-4'>
            <div className='text-muted-foreground text-sm'>Quick Action</div>
            <div className='mt-2'>
              {detail.product.deliveryUrl ? (
                <Link
                  href={detail.product.deliveryUrl}
                  target='_blank'
                  rel='noreferrer'
                  className='inline-flex rounded-lg border px-3 py-2 text-sm font-medium'
                >
                  Open Access
                </Link>
              ) : (
                <span className='text-muted-foreground text-sm'>No digital access link</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Related Documents</CardTitle>
          <CardDescription>
            Invoice and quotation history that includes this product or service.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-3'>
          {detail.sources.length === 0 ? (
            <div className='text-muted-foreground text-sm'>
              No linked invoice or quotation found for this product yet.
            </div>
          ) : (
            detail.sources.map((source) => (
              <Link
                key={`${source.sourceType}-${source.sourceId}`}
                href={source.sourcePath}
                className='block rounded-xl border p-4 text-sm hover:bg-muted/40'
              >
                <div className='font-medium'>{source.label}</div>
                <div className='text-muted-foreground mt-1'>
                  Source {source.sourceType}: {source.sourceNumber}
                </div>
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
