import PageContainer from '@/components/layout/page-container';
import { buttonVariants } from '@/components/ui/button';
import CategoryListingPage from '@/features/categories/components/category-listing';
import { searchParamsCache } from '@/lib/searchparams';
import { cn } from '@/lib/utils';
import { Icons } from '@/components/icons';
import Link from 'next/link';
import { SearchParams } from 'nuqs/server';
import { categoryInfoContent } from '@/config/infoconfig';

export const metadata = {
  title: 'Dashboard: Service Types'
};

type pageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function Page(props: pageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);

  return (
    <PageContainer
      pageTitle='Service Types'
      pageDescription='Manage service groupings such as design, development, and consulting.'
      infoContent={categoryInfoContent}
      pageHeaderAction={
        <Link
          href='/dashboard/categories/new'
          className={cn(buttonVariants(), 'text-xs md:text-sm')}
        >
          <Icons.add className='mr-2 h-4 w-4' /> Add Type
        </Link>
      }
    >
      <CategoryListingPage />
    </PageContainer>
  );
}
