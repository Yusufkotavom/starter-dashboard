import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import PageContainer from '@/components/layout/page-container';
import { productsQueryOptions } from '@/features/products/api/queries';
import { subscriptionPlanByIdOptions } from '@/features/subscriptions/api/queries';
import SubscriptionPlanViewPage from '@/features/subscriptions/components/subscription-plan-view-page';
import { getQueryClient } from '@/lib/query-client';

type PageProps = { params: Promise<{ planId: string }> };

export default async function Page(props: PageProps) {
  const params = await props.params;
  const queryClient = getQueryClient();

  void queryClient.prefetchQuery(productsQueryOptions({ page: 1, limit: 1000 }));

  if (params.planId !== 'new') {
    void queryClient.prefetchQuery(subscriptionPlanByIdOptions(Number(params.planId)));
  }

  return (
    <PageContainer>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <SubscriptionPlanViewPage planId={params.planId} />
      </HydrationBoundary>
    </PageContainer>
  );
}
