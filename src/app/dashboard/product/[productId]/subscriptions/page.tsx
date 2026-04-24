import Link from 'next/link';
import { notFound } from 'next/navigation';
import PageContainer from '@/components/layout/page-container';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import { prisma } from '@/lib/prisma';
import { cn, formatPrice } from '@/lib/utils';

type PageProps = {
  params: Promise<{ productId: string }>;
};

export default async function ProductSubscriptionsPage(props: PageProps) {
  const { productId } = await props.params;
  const id = Number(productId);

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      subscriptionPlans: {
        include: {
          _count: {
            select: {
              subscriptions: true
            }
          },
          subscriptions: {
            include: {
              client: true,
              project: true
            },
            orderBy: {
              createdAt: 'desc'
            }
          }
        },
        orderBy: [{ isActive: 'desc' }, { createdAt: 'asc' }]
      }
    }
  });

  if (!product) {
    notFound();
  }

  return (
    <PageContainer
      pageTitle={`${product.name} Plans`}
      pageDescription='Manage recurring plans and linked client subscriptions for this catalog item.'
      pageHeaderAction={
        <div className='flex gap-2'>
          <Link
            href={`/dashboard/product/${product.id}`}
            className={cn(buttonVariants({ variant: 'outline' }), 'text-xs md:text-sm')}
          >
            Back to Item
          </Link>
          <Link
            href={`/dashboard/product/${product.id}/subscriptions/new`}
            className={cn(buttonVariants(), 'text-xs md:text-sm')}
          >
            <Icons.add className='mr-2 h-4 w-4' />
            Add Client Subscription
          </Link>
        </div>
      }
    >
      <div className='space-y-6'>
        {product.subscriptionPlans.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No recurring plans yet</CardTitle>
              <CardDescription>
                Add plans from the catalog item form first, then assign clients here.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          product.subscriptionPlans.map((plan) => (
            <Card key={plan.id}>
              <CardHeader>
                <div className='flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between'>
                  <div className='space-y-1'>
                    <CardTitle>{plan.name}</CardTitle>
                    <CardDescription>
                      {formatPrice(Number(plan.price))} / {plan.interval.toLowerCase()}
                    </CardDescription>
                  </div>
                  <div className='flex flex-wrap gap-2'>
                    <Badge variant={plan.isActive ? 'default' : 'secondary'}>
                      {plan.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge variant='outline'>{plan._count.subscriptions} subscribers</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className='space-y-4'>
                {plan.description ? (
                  <div className='text-muted-foreground text-sm'>{plan.description}</div>
                ) : null}
                {plan.subscriptions.length === 0 ? (
                  <div className='text-muted-foreground rounded-lg border border-dashed p-4 text-sm'>
                    No client subscriptions attached to this plan yet.
                  </div>
                ) : (
                  <div className='space-y-3'>
                    {plan.subscriptions.map((subscription) => (
                      <div
                        key={subscription.id}
                        className='flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-center md:justify-between'
                      >
                        <div className='space-y-1'>
                          <div className='font-medium'>
                            {subscription.client.company ?? subscription.client.name}
                          </div>
                          <div className='text-muted-foreground text-sm'>
                            {subscription.status} · Next billing{' '}
                            {subscription.nextBillingDate?.toISOString().slice(0, 10) ?? 'not set'}
                          </div>
                          <div className='text-muted-foreground text-sm'>
                            {subscription.project?.name ?? 'No linked project'}
                          </div>
                        </div>
                        <div className='flex gap-2'>
                          <Link
                            href={`/dashboard/product/${product.id}/subscriptions/${subscription.id}`}
                            className={cn(
                              buttonVariants({ variant: 'outline' }),
                              'text-xs md:text-sm'
                            )}
                          >
                            <Icons.edit className='mr-2 h-4 w-4' />
                            Edit
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </PageContainer>
  );
}
