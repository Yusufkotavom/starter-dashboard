import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { categoryByIdOptions } from '@/features/categories/api/queries';
import PageContainer from '@/components/layout/page-container';
import CategoryViewPage from '@/features/categories/components/category-view-page';

export const metadata = {
  title: 'Dashboard: Category View'
};

type PageProps = { params: Promise<{ categoryId: string }> };

export default async function Page(props: PageProps) {
  const params = await props.params;
  const queryClient = getQueryClient();

  if (params.categoryId !== 'new') {
    void queryClient.prefetchQuery(categoryByIdOptions(Number(params.categoryId)));
  }

  return (
    <PageContainer>
      <div className='flex-1 space-y-4'>
        <HydrationBoundary state={dehydrate(queryClient)}>
          <CategoryViewPage categoryId={params.categoryId} />
        </HydrationBoundary>
      </div>
    </PageContainer>
  );
}
