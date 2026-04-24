import PageContainer from '@/components/layout/page-container';
import ModulePlaceholder from '@/components/layout/module-placeholder';

export const metadata = {
  title: 'Dashboard: Invoices'
};

export default function InvoicesPage() {
  return (
    <PageContainer
      pageTitle='Invoices'
      pageDescription='Issue invoices from approved work and monitor collection status.'
    >
      <ModulePlaceholder
        title='Invoice management is planned for phase 2.'
        description='This finance section is wired in the navigation so the agency flow is coherent, but the detailed CRUD and payment reconciliation screens are not built yet.'
        bullets={[
          'Invoice status support is already modeled in Prisma: draft, sent, paid, partial, overdue, and cancelled.',
          'Invoices will connect to clients and optionally to projects for delivery-based billing.',
          'Partial payment and overdue tracking will roll into the reports module later.'
        ]}
      />
    </PageContainer>
  );
}
