import PageContainer from '@/components/layout/page-container';
import SubscriptionsListingPage from '@/features/subscriptions/components/subscriptions-listing';

export const metadata = {
  title: 'Dashboard: Subscriptions'
};

export default function Page() {
  return (
    <PageContainer
      pageTitle='Subscriptions'
      pageDescription='Manage recurring plans and client subscriptions from one workspace.'
    >
      <SubscriptionsListingPage />
    </PageContainer>
  );
}
