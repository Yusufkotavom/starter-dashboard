import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { Suspense } from 'react';
import { getQueryClient } from '@/lib/query-client';
import { communicationsQueryOptions } from '../api/queries';
import type { CommunicationFilters } from '../api/types';
import { CommunicationsInbox, CommunicationsInboxSkeleton } from './communications-inbox';

interface CommunicationsListingPageProps {
  filters: CommunicationFilters;
}

export default function CommunicationsListingPage({ filters }: CommunicationsListingPageProps) {
  const queryClient = getQueryClient();

  void queryClient.prefetchQuery(communicationsQueryOptions(filters));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<CommunicationsInboxSkeleton />}>
        <CommunicationsInbox filters={filters} />
      </Suspense>
    </HydrationBoundary>
  );
}
