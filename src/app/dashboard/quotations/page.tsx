import type { SearchParams } from 'nuqs/server';
import Link from 'next/link';
import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import QuotationListingPage from '@/features/quotations/components/quotation-listing';
import { searchParamsCache } from '@/lib/searchparams';

export const metadata = {
  title: 'Dashboard: Quotations'
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function QuotationsPage(props: PageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);

  return (
    <PageContainer
      pageTitle='Quotations'
      pageDescription='Build and track proposals before they become active projects.'
      pageHeaderAction={
        <Button asChild>
          <Link href='/dashboard/quotations/new'>
            <Icons.add className='mr-2 h-4 w-4' />
            New Quotation
          </Link>
        </Button>
      }
    >
      <QuotationListingPage />
    </PageContainer>
  );
}
