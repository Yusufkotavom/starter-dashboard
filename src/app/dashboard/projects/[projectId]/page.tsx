import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import PageContainer from '@/components/layout/page-container';
import { clientsQueryOptions } from '@/features/clients/api/queries';
import { projectByIdOptions } from '@/features/projects/api/queries';
import ProjectViewPage from '@/features/projects/components/project-view-page';
import { quotationsQueryOptions } from '@/features/quotations/api/queries';
import { getQueryClient } from '@/lib/query-client';

type PageProps = { params: Promise<{ projectId: string }> };

export default async function Page(props: PageProps) {
  const params = await props.params;
  const queryClient = getQueryClient();

  void queryClient.prefetchQuery(clientsQueryOptions({ page: 1, limit: 1000 }));
  void queryClient.prefetchQuery(quotationsQueryOptions({ page: 1, limit: 1000 }));

  if (params.projectId !== 'new') {
    void queryClient.prefetchQuery(projectByIdOptions(Number(params.projectId)));
  }

  return (
    <PageContainer>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <ProjectViewPage projectId={params.projectId} />
      </HydrationBoundary>
    </PageContainer>
  );
}
