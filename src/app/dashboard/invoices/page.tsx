import type { SearchParams } from 'nuqs/server';
import PageContainer from '@/components/layout/page-container';
import InvoiceListingPage from '@/features/invoices/components/invoice-listing';
import { InvoiceFormSheetTrigger } from '@/features/invoices/components/invoice-form-sheet';
import { searchParamsCache } from '@/lib/searchparams';

export const metadata = {
  title: 'Dashboard: Invoices'
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function InvoicesPage(props: PageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);

  return (
    <PageContainer
      pageTitle='Invoices'
      pageDescription='Track billing status, due dates, and invoice value per client.'
      pageHeaderAction={<InvoiceFormSheetTrigger />}
    >
      <InvoiceListingPage />
    </PageContainer>
  );
}
