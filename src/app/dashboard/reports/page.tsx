import PageContainer from '@/components/layout/page-container';
import ModulePlaceholder from '@/components/layout/module-placeholder';

export const metadata = {
  title: 'Dashboard: Reports'
};

export default function ReportsPage() {
  return (
    <PageContainer
      pageTitle='Reports'
      pageDescription='Agency KPI reporting across CRM, delivery, and finance.'
    >
      <ModulePlaceholder
        title='Reporting will land after the transactional modules are stable.'
        description='The dashboard overview can already evolve into agency KPIs, while this dedicated reports section is reserved for deeper analysis.'
        bullets={[
          'Planned KPIs include revenue, quotation pipeline, active projects, overdue invoices, and project profitability.',
          'Reports will aggregate client, project, invoice, payment, and expense data into management views.',
          'This route prevents broken navigation while the analytics layer is still being built.'
        ]}
      />
    </PageContainer>
  );
}
