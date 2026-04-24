import PageContainer from '@/components/layout/page-container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { prisma } from '@/lib/prisma';
import { formatPrice } from '@/lib/utils';

export const metadata = {
  title: 'Dashboard: Subscriptions'
};

export default async function SubscriptionsPage() {
  const [plans, subscriptions] = await Promise.all([
    prisma.subscriptionPlan.findMany({
      include: { service: true },
      orderBy: { name: 'asc' }
    }),
    prisma.clientSubscription.findMany({
      include: {
        client: true,
        plan: true,
        project: true,
        invoices: { select: { id: true, total: true, status: true } }
      },
      orderBy: { createdAt: 'desc' }
    })
  ]);

  return (
    <PageContainer
      pageTitle='Subscriptions'
      pageDescription='Manage recurring retainers, renewal schedules, and subscription-linked invoices.'
    >
      <div className='space-y-6'>
        <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
          <Card>
            <CardHeader className='pb-2'>
              <CardDescription>Active Plans</CardDescription>
              <CardTitle className='text-3xl'>
                {plans.filter((plan) => plan.isActive).length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className='pb-2'>
              <CardDescription>Live Subscriptions</CardDescription>
              <CardTitle className='text-3xl'>
                {subscriptions.filter((item) => item.status === 'ACTIVE').length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className='pb-2'>
              <CardDescription>Auto Renew</CardDescription>
              <CardTitle className='text-3xl'>
                {subscriptions.filter((item) => item.autoRenew).length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className='pb-2'>
              <CardDescription>Recurring MRR</CardDescription>
              <CardTitle className='text-3xl'>
                {formatPrice(
                  subscriptions
                    .filter((item) => item.status === 'ACTIVE')
                    .reduce((sum, item) => sum + Number(item.priceOverride ?? item.plan.price), 0)
                )}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        <div className='grid gap-6 xl:grid-cols-2'>
          <Card>
            <CardHeader>
              <CardTitle>Subscription Plans</CardTitle>
              <CardDescription>Catalog of recurring service contracts.</CardDescription>
            </CardHeader>
            <CardContent className='space-y-3'>
              {plans.map((plan) => (
                <div key={plan.id} className='rounded-lg border p-4'>
                  <div className='flex items-center justify-between gap-4'>
                    <div>
                      <div className='font-medium'>{plan.name}</div>
                      <div className='text-muted-foreground mt-1 text-sm'>
                        {plan.service?.name ?? 'Standalone plan'}
                      </div>
                    </div>
                    <div className='text-right'>
                      <div className='font-medium'>{formatPrice(Number(plan.price))}</div>
                      <div className='text-muted-foreground mt-1 text-sm'>
                        {plan.interval.toLowerCase()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Client Subscriptions</CardTitle>
              <CardDescription>Recurring contracts linked to clients and projects.</CardDescription>
            </CardHeader>
            <CardContent className='space-y-3'>
              {subscriptions.map((subscription) => (
                <div key={subscription.id} className='rounded-lg border p-4'>
                  <div className='flex items-center justify-between gap-4'>
                    <div>
                      <div className='font-medium'>
                        {subscription.client.company ?? subscription.client.name}
                      </div>
                      <div className='text-muted-foreground mt-1 text-sm'>
                        {subscription.plan.name}
                      </div>
                      <div className='text-muted-foreground mt-1 text-sm'>
                        Next billing{' '}
                        {subscription.nextBillingDate
                          ? subscription.nextBillingDate.toISOString().slice(0, 10)
                          : 'not set'}
                      </div>
                    </div>
                    <div className='text-right'>
                      <div className='font-medium'>
                        {formatPrice(Number(subscription.priceOverride ?? subscription.plan.price))}
                      </div>
                      <div className='text-muted-foreground mt-1 text-sm'>
                        {subscription.status}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
