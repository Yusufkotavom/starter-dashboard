import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { Suspense } from 'react';
import PageContainer from '@/components/layout/page-container';
import { getQueryClient } from '@/lib/query-client';
import { communicationByIdOptions } from '@/features/communications/api/queries';
import CommunicationViewPage, {
  CommunicationViewSkeleton
} from '@/features/communications/components/communication-view-page';

export const metadata = {
  title: 'Dashboard: Communication Thread'
};

type PageProps = {
  params: Promise<{ communicationId: string }>;
};

export default async function CommunicationThreadPage(props: PageProps) {
  const params = await props.params;
  const communicationId = Number(params.communicationId);
  const queryClient = getQueryClient();

  void queryClient.prefetchQuery(communicationByIdOptions(communicationId));

  return (
    <PageContainer
      pageTitle='Conversation Detail'
      pageDescription='Review the thread, attach it to a client record, and send the next reply.'
    >
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense fallback={<CommunicationViewSkeleton />}>
          <CommunicationViewPage communicationId={communicationId} />
        </Suspense>
      </HydrationBoundary>
    </PageContainer>
  );
}
