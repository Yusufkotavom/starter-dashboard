import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import PageContainer from '@/components/layout/page-container';
import { invoicesQueryOptions } from '@/features/invoices/api/queries';
import { paymentByIdOptions } from '@/features/payments/api/queries';
import PaymentViewPage from '@/features/payments/components/payment-view-page';
import { getQueryClient } from '@/lib/query-client';

type PageProps = { params: Promise<{ paymentId: string }> };

export default async function Page(props: PageProps) {
  const params = await props.params;
  const queryClient = getQueryClient();

  void queryClient.prefetchQuery(invoicesQueryOptions({ page: 1, limit: 1000 }));

  if (params.paymentId !== 'new') {
    void queryClient.prefetchQuery(paymentByIdOptions(Number(params.paymentId)));
  }

  return (
    <PageContainer>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <PaymentViewPage paymentId={params.paymentId} />
      </HydrationBoundary>
    </PageContainer>
  );
}
