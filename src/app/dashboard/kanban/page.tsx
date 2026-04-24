import type { SearchParams } from 'nuqs/server';
import KanbanViewPage from '@/features/kanban/components/kanban-view-page';

export const metadata = {
  title: 'Dashboard : Kanban view'
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

function getSingleValue(value: string | string[] | null | undefined): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

export default async function Page(props: PageProps) {
  const searchParams = await props.searchParams;

  return (
    <KanbanViewPage
      context={{
        projectId: getSingleValue(searchParams.projectId),
        projectName: getSingleValue(searchParams.project),
        clientName: getSingleValue(searchParams.client),
        phase: getSingleValue(searchParams.phase),
        progress: (() => {
          const value = getSingleValue(searchParams.progress);
          const parsed = value ? Number(value) : NaN;
          return Number.isFinite(parsed) ? parsed : undefined;
        })()
      }}
    />
  );
}
