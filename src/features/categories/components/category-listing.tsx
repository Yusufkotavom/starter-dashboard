import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { categoriesQueryOptions } from '../api/queries';
import { CategoryTable } from './category-tables';

export default function CategoryListingPage() {
  const page = searchParamsCache.get('page');
  const search = searchParamsCache.get('name');
  const pageLimit = searchParamsCache.get('perPage');
  const sort = searchParamsCache.get('sort');

  const filters = {
    page,
    limit: pageLimit,
    ...(search && { search }),
    ...(sort && { sort })
  };

  const queryClient = getQueryClient();

  void queryClient.prefetchQuery(categoriesQueryOptions(filters));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <CategoryTable />
    </HydrationBoundary>
  );
}
