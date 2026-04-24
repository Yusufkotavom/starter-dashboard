'use client';

import { notFound } from 'next/navigation';
import { useSuspenseQuery } from '@tanstack/react-query';
import type { Payment } from '../api/types';
import { paymentByIdOptions } from '../api/queries';
import PaymentForm from './payment-form';

export default function PaymentViewPage({ paymentId }: { paymentId: string }) {
  if (paymentId === 'new') {
    return <PaymentForm initialData={null} pageTitle='Record Payment' />;
  }

  return <EditPaymentView paymentId={Number(paymentId)} />;
}

function EditPaymentView({ paymentId }: { paymentId: number }) {
  const { data } = useSuspenseQuery(paymentByIdOptions(paymentId));

  if (!data) {
    notFound();
  }

  return <PaymentForm initialData={data as Payment} pageTitle='Edit Payment' />;
}
