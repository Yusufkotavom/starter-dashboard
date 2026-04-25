import { Suspense } from 'react';
import PageContainer from '@/components/layout/page-container';
import { getQueryClient } from '@/lib/query-client';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import {
  settingsQueryOptions,
  whatsappSetupStatusQueryOptions
} from '@/features/settings/api/queries';
import SettingsForm from '@/features/settings/components/settings-form';

export const metadata = {
  title: 'Dashboard: Settings'
};

export default function SettingsPage() {
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(settingsQueryOptions());
  void queryClient.prefetchQuery(whatsappSetupStatusQueryOptions());

  return (
    <PageContainer
      pageTitle='Settings'
      pageDescription='Configure company profile, document numbering, defaults, and approval rules.'
    >
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense>
          <SettingsForm />
        </Suspense>
      </HydrationBoundary>
    </PageContainer>
  );
}
