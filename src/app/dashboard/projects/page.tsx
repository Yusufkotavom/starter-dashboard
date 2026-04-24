import type { SearchParams } from 'nuqs/server';
import PageContainer from '@/components/layout/page-container';
import ProjectListingPage from '@/features/projects/components/project-listing';
import { ProjectFormSheetTrigger } from '@/features/projects/components/project-form-sheet';
import { searchParamsCache } from '@/lib/searchparams';

export const metadata = {
  title: 'Dashboard: Projects'
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function ProjectsPage(props: PageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);

  return (
    <PageContainer
      pageTitle='Projects'
      pageDescription='Track active delivery work from kickoff to completion.'
      pageHeaderAction={<ProjectFormSheetTrigger />}
    >
      <ProjectListingPage />
    </PageContainer>
  );
}
