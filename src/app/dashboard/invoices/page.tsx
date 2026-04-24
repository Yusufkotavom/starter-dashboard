import type { SearchParams } from 'nuqs/server';
import Link from 'next/link';
import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import InvoiceListingPage from '@/features/invoices/components/invoice-listing';
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
      pageHeaderAction={
        <Button asChild>
          <Link href='/dashboard/invoices/new'>
            <Icons.add className='mr-2 h-4 w-4' />
            New Invoice
          </Link>
        </Button>
      }
    >
      <InvoiceListingPage />
    </PageContainer>
  );
}
