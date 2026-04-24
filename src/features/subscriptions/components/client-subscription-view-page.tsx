'use client';

import { notFound } from 'next/navigation';
import { useSuspenseQuery } from '@tanstack/react-query';
import { clientSubscriptionByIdOptions } from '../api/queries';
import type { ClientSubscription } from '../api/types';
import ClientSubscriptionForm from './client-subscription-form';

export default function ClientSubscriptionViewPage({
  subscriptionId,
  serviceId,
  returnPath
}: {
  subscriptionId: string;
  serviceId?: number;
  returnPath?: string;
}) {
  if (subscriptionId === 'new') {
    return (
      <ClientSubscriptionForm
        initialData={null}
        pageTitle='Create Client Subscription'
        serviceId={serviceId}
        returnPath={returnPath}
      />
    );
  }

  return (
    <EditClientSubscriptionView
      subscriptionId={Number(subscriptionId)}
      serviceId={serviceId}
      returnPath={returnPath}
    />
  );
}

function EditClientSubscriptionView({
  subscriptionId,
  serviceId,
  returnPath
}: {
  subscriptionId: number;
  serviceId?: number;
  returnPath?: string;
}) {
  const { data } = useSuspenseQuery(clientSubscriptionByIdOptions(subscriptionId));

  if (!data) {
    notFound();
  }

  return (
    <ClientSubscriptionForm
      initialData={data as ClientSubscription}
      pageTitle='Edit Client Subscription'
      serviceId={serviceId}
      returnPath={returnPath}
    />
  );
}
