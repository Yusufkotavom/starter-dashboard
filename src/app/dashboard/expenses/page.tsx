import type { SearchParams } from 'nuqs/server';
import PageContainer from '@/components/layout/page-container';
import ExpenseListingPage from '@/features/expenses/components/expense-listing';
import { ExpenseFormSheetTrigger } from '@/features/expenses/components/expense-form-sheet';
import { searchParamsCache } from '@/lib/searchparams';

export const metadata = {
  title: 'Dashboard: Expenses'
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function ExpensesPage(props: PageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);

  return (
    <PageContainer
      pageTitle='Expenses'
      pageDescription='Track cost outflow tied to delivery, vendors, and operations.'
      pageHeaderAction={<ExpenseFormSheetTrigger />}
    >
      <ExpenseListingPage />
    </PageContainer>
  );
}
