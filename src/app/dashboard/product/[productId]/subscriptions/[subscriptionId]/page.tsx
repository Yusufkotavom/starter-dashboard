import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { notFound } from 'next/navigation';
import PageContainer from '@/components/layout/page-container';
import { getQueryClient } from '@/lib/query-client';
import { clientsQueryOptions } from '@/features/clients/api/queries';
import { projectsQueryOptions } from '@/features/projects/api/queries';
import {
  clientSubscriptionByIdOptions,
  subscriptionPlansQueryOptions
} from '@/features/subscriptions/api/queries';
import ClientSubscriptionViewPage from '@/features/subscriptions/components/client-subscription-view-page';
import { prisma } from '@/lib/prisma';

type PageProps = {
  params: Promise<{
    productId: string;
    subscriptionId: string;
  }>;
};

export default async function ProductClientSubscriptionPage(props: PageProps) {
  const { productId, subscriptionId } = await props.params;
  const id = Number(productId);

  const product = await prisma.product.findUnique({
    where: { id },
    select: { id: true, name: true }
  });

  if (!product) {
    notFound();
  }

  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(clientsQueryOptions({ page: 1, limit: 1000 }));
  void queryClient.prefetchQuery(projectsQueryOptions({ page: 1, limit: 1000 }));
  void queryClient.prefetchQuery(subscriptionPlansQueryOptions({ page: 1, limit: 1000 }));

  if (subscriptionId !== 'new') {
    void queryClient.prefetchQuery(clientSubscriptionByIdOptions(Number(subscriptionId)));
  }

  return (
    <PageContainer
      pageTitle={
        subscriptionId === 'new' ? 'Create Client Subscription' : 'Edit Client Subscription'
      }
      pageDescription={`Manage subscribers for ${product.name} from a dedicated full-page workspace.`}
    >
      <HydrationBoundary state={dehydrate(queryClient)}>
        <ClientSubscriptionViewPage
          subscriptionId={subscriptionId}
          serviceId={product.id}
          returnPath={`/dashboard/product/${product.id}/subscriptions`}
        />
      </HydrationBoundary>
    </PageContainer>
  );
}
