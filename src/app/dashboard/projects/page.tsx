import type { SearchParams } from 'nuqs/server';
import Link from 'next/link';
import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import ProjectListingPage from '@/features/projects/components/project-listing';
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
      pageHeaderAction={
        <Button asChild>
          <Link href='/dashboard/projects/new'>
            <Icons.add className='mr-2 h-4 w-4' />
            New Project
          </Link>
        </Button>
      }
    >
      <ProjectListingPage />
    </PageContainer>
  );
}
