import PageContainer from '@/components/layout/page-container';
import ModulePlaceholder from '@/components/layout/module-placeholder';

export const metadata = {
  title: 'Dashboard: Quotations'
};

export default function QuotationsPage() {
  return (
    <PageContainer
      pageTitle='Quotations'
      pageDescription='Prepare, send, and convert proposals into active projects.'
    >
      <ModulePlaceholder
        title='Quotation workflow is next in the build queue.'
        description='The schema and navigation are already prepared; the CRUD layer and approval flow are the next implementation target after clients and projects.'
        bullets={[
          'Draft, sent, approved, rejected, and expired statuses are already mapped in Prisma.',
          'Quotation items will link directly to the service catalog for reusable pricing.',
          'Approved quotations will be convertible into projects without duplicate data entry.'
        ]}
      />
    </PageContainer>
  );
}
