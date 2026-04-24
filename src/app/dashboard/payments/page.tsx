import PageContainer from '@/components/layout/page-container';
import ModulePlaceholder from '@/components/layout/module-placeholder';

export const metadata = {
  title: 'Dashboard: Payments'
};

export default function PaymentsPage() {
  return (
    <PageContainer
      pageTitle='Payments'
      pageDescription='Record settlement details for each invoice, including partial payments.'
    >
      <ModulePlaceholder
        title='Payments tracking will follow invoices.'
        description='The payment model already exists in Prisma, but the operational screens are intentionally deferred until invoice creation is stable.'
        bullets={[
          'Each payment will belong to a single invoice with amount, method, reference, and paid date.',
          'Partial payment support is already planned in the invoice status flow.',
          'This module will become the main source for cash-in reporting and aging analysis.'
        ]}
      />
    </PageContainer>
  );
}
