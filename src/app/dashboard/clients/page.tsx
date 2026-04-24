import PageContainer from '@/components/layout/page-container';
import ClientListingPage from '@/features/clients/components/client-listing';
import { ClientFormSheetTrigger } from '@/features/clients/components/client-form-sheet';
import { searchParamsCache } from '@/lib/searchparams';
import type { SearchParams } from 'nuqs/server';

export const metadata = {
  title: 'Dashboard: Clients'
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function Page(props: PageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);

  return (
    <PageContainer
      pageTitle='Clients'
      pageDescription='Manage your clients and leads.'
      pageHeaderAction={<ClientFormSheetTrigger />}
    >
      <ClientListingPage />
    </PageContainer>
  );
}
