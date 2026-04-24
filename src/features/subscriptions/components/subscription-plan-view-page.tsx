'use client';

import { notFound } from 'next/navigation';
import { useSuspenseQuery } from '@tanstack/react-query';
import { subscriptionPlanByIdOptions } from '../api/queries';
import type { SubscriptionPlan } from '../api/types';
import SubscriptionPlanForm from './subscription-plan-form';

export default function SubscriptionPlanViewPage({ planId }: { planId: string }) {
  if (planId === 'new') {
    return <SubscriptionPlanForm initialData={null} pageTitle='Create Subscription Plan' />;
  }

  return <EditSubscriptionPlanView planId={Number(planId)} />;
}

function EditSubscriptionPlanView({ planId }: { planId: number }) {
  const { data } = useSuspenseQuery(subscriptionPlanByIdOptions(planId));

  if (!data) {
    notFound();
  }

  return (
    <SubscriptionPlanForm
      initialData={data as SubscriptionPlan}
      pageTitle='Edit Subscription Plan'
    />
  );
}
