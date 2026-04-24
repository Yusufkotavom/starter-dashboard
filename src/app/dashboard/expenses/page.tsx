import PageContainer from '@/components/layout/page-container';
import ModulePlaceholder from '@/components/layout/module-placeholder';

export const metadata = {
  title: 'Dashboard: Expenses'
};

export default function ExpensesPage() {
  return (
    <PageContainer
      pageTitle='Expenses'
      pageDescription='Track project costs, vendor spend, and operational outflow.'
    >
      <ModulePlaceholder
        title='Expense tracking is reserved for the finance rollout.'
        description='The data model is already present so project profitability can be layered in later without reshaping the database.'
        bullets={[
          'Expenses can be linked to projects for profitability analysis.',
          'Vendor, category, receipt URL, and notes are already represented in Prisma.',
          'Reports will use this dataset to calculate project margin and cost breakdowns.'
        ]}
      />
    </PageContainer>
  );
}
