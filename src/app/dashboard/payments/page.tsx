import type { SearchParams } from 'nuqs/server';
import Link from 'next/link';
import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import PaymentListingPage from '@/features/payments/components/payment-listing';
import { searchParamsCache } from '@/lib/searchparams';

export const metadata = {
  title: 'Dashboard: Payments'
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function PaymentsPage(props: PageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);

  return (
    <PageContainer
      pageTitle='Payments'
      pageDescription='Record cash-in activity for sent and paid invoices.'
      pageHeaderAction={
        <Button asChild>
          <Link href='/dashboard/payments/new'>
            <Icons.add className='mr-2 h-4 w-4' />
            Record Payment
          </Link>
        </Button>
      }
    >
      <PaymentListingPage />
    </PageContainer>
  );
}
