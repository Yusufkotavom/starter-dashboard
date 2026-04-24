import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import PageContainer from '@/components/layout/page-container';
import { clientsQueryOptions } from '@/features/clients/api/queries';
import { productsQueryOptions } from '@/features/products/api/queries';
import { quotationByIdOptions } from '@/features/quotations/api/queries';
import QuotationViewPage from '@/features/quotations/components/quotation-view-page';
import { getQueryClient } from '@/lib/query-client';

type PageProps = { params: Promise<{ quotationId: string }> };

export default async function Page(props: PageProps) {
  const params = await props.params;
  const queryClient = getQueryClient();

  void queryClient.prefetchQuery(clientsQueryOptions({ page: 1, limit: 1000 }));
  void queryClient.prefetchQuery(productsQueryOptions({ page: 1, limit: 1000 }));

  if (params.quotationId !== 'new') {
    void queryClient.prefetchQuery(quotationByIdOptions(Number(params.quotationId)));
  }

  return (
    <PageContainer>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <QuotationViewPage quotationId={params.quotationId} />
      </HydrationBoundary>
    </PageContainer>
  );
}
