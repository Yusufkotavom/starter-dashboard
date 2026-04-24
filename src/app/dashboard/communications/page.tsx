import PageContainer from '@/components/layout/page-container';
import CommunicationsListingPage from '@/features/communications/components/communications-listing';

export const metadata = {
  title: 'Dashboard: Communications'
};

type PageProps = {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    search?: string;
    unreadOnly?: string;
  }>;
};

function parsePositiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export default async function CommunicationsPage(props: PageProps) {
  const searchParams = await props.searchParams;

  const filters = {
    page: parsePositiveInteger(searchParams.page, 1),
    limit: parsePositiveInteger(searchParams.limit, 25),
    ...(searchParams.search ? { search: searchParams.search } : {}),
    unreadOnly: searchParams.unreadOnly === 'true'
  };

  return (
    <PageContainer
      pageTitle='Communications'
      pageDescription='Manage inbound WhatsApp conversations, link them to clients, and reply from one operational inbox.'
    >
      <CommunicationsListingPage filters={filters} />
    </PageContainer>
  );
}
