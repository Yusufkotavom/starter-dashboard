import type { SearchParams } from 'nuqs/server';
import PageContainer from '@/components/layout/page-container';
import QuotationListingPage from '@/features/quotations/components/quotation-listing';
import { QuotationFormSheetTrigger } from '@/features/quotations/components/quotation-form-sheet';
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
      pageHeaderAction={<QuotationFormSheetTrigger />}
    >
      <QuotationListingPage />
    </PageContainer>
  );
}
