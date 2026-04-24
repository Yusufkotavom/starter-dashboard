'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Icons } from '@/components/icons';
import { AlertModal } from '@/components/modal/alert-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatPrice } from '@/lib/utils';
import { deleteClientSubscriptionMutation, deleteSubscriptionPlanMutation } from '../api/mutations';
import { clientSubscriptionsQueryOptions, subscriptionPlansQueryOptions } from '../api/queries';

const PLAN_FILTERS = { page: 1, limit: 100 };
const SUBSCRIPTION_FILTERS = { page: 1, limit: 100 };

function formatDate(value: string | null): string {
  return value ? value.slice(0, 10) : 'Not set';
}

export function SubscriptionsOverviewSkeleton() {
  return (
    <div className='grid gap-6 xl:grid-cols-2'>
      {[0, 1].map((key) => (
        <Card key={key}>
          <CardHeader>
            <div className='bg-muted h-6 w-48 animate-pulse rounded' />
            <div className='bg-muted h-4 w-64 animate-pulse rounded' />
          </CardHeader>
          <CardContent className='space-y-4'>
            {[0, 1, 2].map((item) => (
              <div key={item} className='bg-muted h-20 animate-pulse rounded-lg' />
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function SubscriptionsOverview() {
  const { data: planData } = useSuspenseQuery(subscriptionPlansQueryOptions(PLAN_FILTERS));
  const { data: subscriptionData } = useSuspenseQuery(
    clientSubscriptionsQueryOptions(SUBSCRIPTION_FILTERS)
  );

  const [planToDelete, setPlanToDelete] = useState<number | null>(null);
  const [subscriptionToDelete, setSubscriptionToDelete] = useState<number | null>(null);

  const deletePlan = useMutation({
    ...deleteSubscriptionPlanMutation,
    onSuccess: () => {
      toast.success('Subscription plan deleted');
      setPlanToDelete(null);
    },
    onError: () => {
      toast.error('Failed to delete subscription plan');
    }
  });

  const deleteSubscription = useMutation({
    ...deleteClientSubscriptionMutation,
    onSuccess: () => {
      toast.success('Client subscription deleted');
      setSubscriptionToDelete(null);
    },
    onError: () => {
      toast.error('Failed to delete client subscription');
    }
  });

  return (
    <>
      <AlertModal
        isOpen={planToDelete !== null}
        onClose={() => setPlanToDelete(null)}
        onConfirm={() => {
          if (planToDelete !== null) {
            deletePlan.mutate(planToDelete);
          }
        }}
        loading={deletePlan.isPending}
      />
      <AlertModal
        isOpen={subscriptionToDelete !== null}
        onClose={() => setSubscriptionToDelete(null)}
        onConfirm={() => {
          if (subscriptionToDelete !== null) {
            deleteSubscription.mutate(subscriptionToDelete);
          }
        }}
        loading={deleteSubscription.isPending}
      />

      <div className='grid gap-6 xl:grid-cols-2'>
        <Card>
          <CardHeader>
            <CardTitle>Subscription Plans</CardTitle>
            <CardDescription>Manage the recurring packages you sell to clients.</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            {planData.items.length === 0 ? (
              <div className='text-muted-foreground rounded-lg border border-dashed p-6 text-sm'>
                No plans yet. Create your first recurring plan.
              </div>
            ) : (
              planData.items.map((plan) => (
                <div
                  key={plan.id}
                  className='bg-card flex flex-col gap-4 rounded-lg border p-4 md:flex-row md:items-start md:justify-between'
                >
                  <div className='space-y-2'>
                    <div className='flex flex-wrap items-center gap-2'>
                      <div className='font-medium'>{plan.name}</div>
                      <Badge variant={plan.isActive ? 'default' : 'secondary'}>
                        {plan.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      <Badge variant='outline'>{plan.interval}</Badge>
                    </div>
                    <div className='text-muted-foreground text-sm'>{plan.slug}</div>
                    {plan.description ? (
                      <div className='text-sm leading-6'>{plan.description}</div>
                    ) : null}
                    <div className='text-muted-foreground text-sm'>
                      Service: {plan.serviceName ?? 'Standalone plan'}
                    </div>
                    <div className='text-muted-foreground text-sm'>
                      Active subscriptions: {plan.activeSubscriptions}
                    </div>
                  </div>

                  <div className='flex shrink-0 flex-col items-start gap-3 md:items-end'>
                    <div className='text-right'>
                      <div className='text-lg font-semibold'>{formatPrice(plan.price)}</div>
                      <div className='text-muted-foreground text-sm'>per {plan.interval}</div>
                    </div>
                    <div className='flex gap-2'>
                      <Button asChild variant='outline' size='sm'>
                        <Link href={`/dashboard/subscriptions/plans/${plan.id}`}>
                          <Icons.edit className='mr-2 h-4 w-4' />
                          Edit
                        </Link>
                      </Button>
                      <Button variant='outline' size='sm' onClick={() => setPlanToDelete(plan.id)}>
                        <Icons.trash className='mr-2 h-4 w-4' />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Client Subscriptions</CardTitle>
            <CardDescription>Track every active recurring agreement per client.</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            {subscriptionData.items.length === 0 ? (
              <div className='text-muted-foreground rounded-lg border border-dashed p-6 text-sm'>
                No client subscriptions yet. Add one to start recurring billing.
              </div>
            ) : (
              subscriptionData.items.map((subscription) => (
                <div
                  key={subscription.id}
                  className='bg-card flex flex-col gap-4 rounded-lg border p-4 md:flex-row md:items-start md:justify-between'
                >
                  <div className='space-y-2'>
                    <div className='flex flex-wrap items-center gap-2'>
                      <div className='font-medium'>{subscription.clientName}</div>
                      {subscription.clientCompany ? (
                        <Badge variant='outline'>{subscription.clientCompany}</Badge>
                      ) : null}
                      <Badge variant='secondary'>{subscription.status}</Badge>
                    </div>
                    <div className='text-sm'>
                      {subscription.planName} · {subscription.planInterval}
                    </div>
                    <div className='text-muted-foreground text-sm'>
                      Project: {subscription.projectName ?? 'No linked project'}
                    </div>
                    <div className='text-muted-foreground text-sm'>
                      Start: {formatDate(subscription.startDate)} · Next billing:{' '}
                      {formatDate(subscription.nextBillingDate)}
                    </div>
                    <div className='text-muted-foreground text-sm'>
                      Invoices: {subscription.invoiceCount} · Auto renew:{' '}
                      {subscription.autoRenew ? 'Enabled' : 'Disabled'}
                    </div>
                    {subscription.notes ? (
                      <div className='text-muted-foreground text-sm'>{subscription.notes}</div>
                    ) : null}
                  </div>

                  <div className='flex shrink-0 flex-col items-start gap-3 md:items-end'>
                    <div className='text-right'>
                      <div className='text-lg font-semibold'>
                        {formatPrice(subscription.effectivePrice)}
                      </div>
                      {subscription.priceOverride ? (
                        <div className='text-muted-foreground text-sm'>override active</div>
                      ) : null}
                    </div>
                    <div className='flex gap-2'>
                      <Button asChild variant='outline' size='sm'>
                        <Link
                          href={`/dashboard/subscriptions/client-subscriptions/${subscription.id}`}
                        >
                          <Icons.edit className='mr-2 h-4 w-4' />
                          Edit
                        </Link>
                      </Button>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => setSubscriptionToDelete(subscription.id)}
                      >
                        <Icons.trash className='mr-2 h-4 w-4' />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
