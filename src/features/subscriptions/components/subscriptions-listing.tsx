import { Suspense } from 'react';
import Link from 'next/link';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { getQueryClient } from '@/lib/query-client';
import { clientSubscriptionsQueryOptions, subscriptionPlansQueryOptions } from '../api/queries';
import { SubscriptionsOverview, SubscriptionsOverviewSkeleton } from './subscriptions-overview';

const PLAN_FILTERS = { page: 1, limit: 100 };
const SUBSCRIPTION_FILTERS = { page: 1, limit: 100 };

export default function SubscriptionsListingPage() {
  const queryClient = getQueryClient();

  void queryClient.prefetchQuery(subscriptionPlansQueryOptions(PLAN_FILTERS));
  void queryClient.prefetchQuery(clientSubscriptionsQueryOptions(SUBSCRIPTION_FILTERS));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className='space-y-6'>
        <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-end'>
          <Button asChild variant='outline'>
            <Link href='/dashboard/subscriptions/plans/new'>
              <Icons.plusCircle className='mr-2 h-4 w-4' />
              New Plan
            </Link>
          </Button>
          <Button asChild>
            <Link href='/dashboard/subscriptions/client-subscriptions/new'>
              <Icons.plusCircle className='mr-2 h-4 w-4' />
              New Client Subscription
            </Link>
          </Button>
        </div>

        <Suspense fallback={<SubscriptionsOverviewSkeleton />}>
          <SubscriptionsOverview />
        </Suspense>
      </div>
    </HydrationBoundary>
  );
}
