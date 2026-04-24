'use client';

import { notFound } from 'next/navigation';
import { useSuspenseQuery } from '@tanstack/react-query';
import { clientSubscriptionByIdOptions } from '../api/queries';
import type { ClientSubscription } from '../api/types';
import ClientSubscriptionForm from './client-subscription-form';

export default function ClientSubscriptionViewPage({ subscriptionId }: { subscriptionId: string }) {
  if (subscriptionId === 'new') {
    return <ClientSubscriptionForm initialData={null} pageTitle='Create Client Subscription' />;
  }

  return <EditClientSubscriptionView subscriptionId={Number(subscriptionId)} />;
}

function EditClientSubscriptionView({ subscriptionId }: { subscriptionId: number }) {
  const { data } = useSuspenseQuery(clientSubscriptionByIdOptions(subscriptionId));

  if (!data) {
    notFound();
  }

  return (
    <ClientSubscriptionForm
      initialData={data as ClientSubscription}
      pageTitle='Edit Client Subscription'
    />
  );
}
