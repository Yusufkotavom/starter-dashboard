import PageContainer from '@/components/layout/page-container';
import DocsPage from '@/features/docs/components/docs-page';

export const metadata = {
  title: 'Dashboard: Docs'
};

export default function Page() {
  return (
    <PageContainer
      pageTitle='Docs'
      pageDescription='Create and manage project documentation with Lexical editor.'
    >
      <DocsPage />
    </PageContainer>
  );
}
