import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import PageContainer from '@/components/layout/page-container';
import { clientsQueryOptions } from '@/features/clients/api/queries';
import { projectsQueryOptions } from '@/features/projects/api/queries';
import {
  clientSubscriptionByIdOptions,
  subscriptionPlansQueryOptions
} from '@/features/subscriptions/api/queries';
import ClientSubscriptionViewPage from '@/features/subscriptions/components/client-subscription-view-page';
import { getQueryClient } from '@/lib/query-client';

type PageProps = { params: Promise<{ subscriptionId: string }> };

export default async function Page(props: PageProps) {
  const params = await props.params;
  const queryClient = getQueryClient();

  void queryClient.prefetchQuery(clientsQueryOptions({ page: 1, limit: 1000 }));
  void queryClient.prefetchQuery(subscriptionPlansQueryOptions({ page: 1, limit: 1000 }));
  void queryClient.prefetchQuery(projectsQueryOptions({ page: 1, limit: 1000 }));

  if (params.subscriptionId !== 'new') {
    void queryClient.prefetchQuery(clientSubscriptionByIdOptions(Number(params.subscriptionId)));
  }

  return (
    <PageContainer>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <ClientSubscriptionViewPage subscriptionId={params.subscriptionId} />
      </HydrationBoundary>
    </PageContainer>
  );
}
