import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PortalPagination } from '@/app/portal/_components/portal-pagination';
import { StatusBadge } from '@/app/portal/_components/status-badge';
import { getPortalSubscriptionsPageData } from '@/lib/customer-portal';
import { formatPrice } from '@/lib/utils';
import { getStatusTone } from '@/app/portal/_components/status-tone';

interface PortalSubscriptionsPageProps {
  searchParams: Promise<{
    page?: string;
  }>;
}

export default async function PortalSubscriptionsPage({
  searchParams
}: PortalSubscriptionsPageProps) {
  const { page } = await searchParams;
  const data = await getPortalSubscriptionsPageData(page);

  if (!data?.client) {
    return null;
  }

  return (
    <div className='space-y-6'>
      <div className='space-y-1'>
        <h1 className='text-3xl font-semibold tracking-tight'>Subscriptions</h1>
        <p className='text-muted-foreground'>
          Full recurring service workspace for your account. Review retained services, next billing,
          and linked invoices from one page.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recurring Services</CardTitle>
          <CardDescription>
            All active and historical subscriptions tied to your account.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          {data.items.length === 0 ? (
            <div className='text-muted-foreground text-sm'>No recurring subscriptions yet.</div>
          ) : (
            data.items.map((subscription) => (
              <div key={subscription.id} className='space-y-4 rounded-xl border p-4'>
                <div className='flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between'>
                  <div className='space-y-1'>
                    <div className='font-medium'>{subscription.plan.name}</div>
                    <div className='text-muted-foreground text-sm'>
                      {formatPrice(Number(subscription.priceOverride ?? subscription.plan.price))} /{' '}
                      {subscription.plan.interval.toLowerCase()}
                    </div>
                    <div className='text-muted-foreground text-sm'>
                      Next billing{' '}
                      {subscription.nextBillingDate
                        ? subscription.nextBillingDate.toISOString().slice(0, 10)
                        : 'not scheduled'}
                    </div>
                    <div className='text-muted-foreground text-sm'>
                      Project: {subscription.project?.name ?? 'No linked project'}
                    </div>
                  </div>
                  <StatusBadge
                    tone={getStatusTone(subscription.status)}
                    value={subscription.status}
                  />
                </div>

                {subscription.invoices.length > 0 ? (
                  <div className='space-y-2'>
                    <div className='text-sm font-medium'>Invoices</div>
                    <div className='grid gap-2 md:grid-cols-2'>
                      {subscription.invoices.slice(0, 6).map((invoice) => (
                        <Link
                          key={invoice.id}
                          href={`/portal/invoices/${invoice.id}`}
                          className='text-muted-foreground rounded-lg border px-3 py-2 text-sm hover:text-foreground'
                        >
                          {invoice.number} · {formatPrice(Number(invoice.total))}
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ))
          )}
          <PortalPagination basePath='/portal/subscriptions' pagination={data.pagination} />
        </CardContent>
      </Card>
    </div>
  );
}
