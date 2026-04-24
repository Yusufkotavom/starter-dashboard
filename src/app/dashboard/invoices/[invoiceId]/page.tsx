import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import PageContainer from '@/components/layout/page-container';
import { clientsQueryOptions } from '@/features/clients/api/queries';
import { invoiceByIdOptions } from '@/features/invoices/api/queries';
import InvoiceViewPage from '@/features/invoices/components/invoice-view-page';
import { projectsQueryOptions } from '@/features/projects/api/queries';
import { getQueryClient } from '@/lib/query-client';

type PageProps = { params: Promise<{ invoiceId: string }> };

export default async function Page(props: PageProps) {
  const params = await props.params;
  const queryClient = getQueryClient();

  void queryClient.prefetchQuery(clientsQueryOptions({ page: 1, limit: 1000 }));
  void queryClient.prefetchQuery(projectsQueryOptions({ page: 1, limit: 1000 }));

  if (params.invoiceId !== 'new') {
    void queryClient.prefetchQuery(invoiceByIdOptions(Number(params.invoiceId)));
  }

  return (
    <PageContainer>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <InvoiceViewPage invoiceId={params.invoiceId} />
      </HydrationBoundary>
    </PageContainer>
  );
}
