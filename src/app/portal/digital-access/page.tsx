import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getPortalClientContext } from '@/lib/customer-portal';

export default async function PortalDigitalAccessPage() {
  const context = await getPortalClientContext();

  if (!context?.client) {
    return null;
  }

  const digitalItems = context.client.invoices.flatMap((invoice) => {
    const projectItems =
      invoice.project?.quotation?.items
        .filter((item) => item.product?.isDigital && item.product.deliveryUrl)
        .map((item) => ({
          key: `invoice-${invoice.id}-item-${item.id}`,
          invoiceId: invoice.id,
          invoiceNumber: invoice.number,
          title: item.description,
          subtitle: item.product?.name ?? 'Digital item',
          deliveryUrl: item.product?.deliveryUrl ?? ''
        })) ?? [];

    const subscriptionItem =
      invoice.subscription?.plan.service?.isDigital && invoice.subscription.plan.service.deliveryUrl
        ? [
            {
              key: `invoice-${invoice.id}-subscription`,
              invoiceId: invoice.id,
              invoiceNumber: invoice.number,
              title: invoice.subscription.plan.name,
              subtitle: invoice.subscription.plan.service.name,
              deliveryUrl: invoice.subscription.plan.service.deliveryUrl
            }
          ]
        : [];

    return [...projectItems, ...subscriptionItem];
  });

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
          {digitalItems.length === 0 ? (
            <div className='text-muted-foreground text-sm'>
              No digital items have been delivered to your account yet.
            </div>
          ) : (
            digitalItems.map((item) => (
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
        </CardContent>
      </Card>
    </div>
  );
}
