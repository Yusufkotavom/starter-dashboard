'use client';

import { notFound } from 'next/navigation';
import { useSuspenseQuery } from '@tanstack/react-query';
import type { Quotation } from '../api/types';
import { quotationByIdOptions } from '../api/queries';
import QuotationForm from './quotation-form';

export default function QuotationViewPage({ quotationId }: { quotationId: string }) {
  if (quotationId === 'new') {
    return <QuotationForm initialData={null} pageTitle='Create Quotation' />;
  }

  return <EditQuotationView quotationId={Number(quotationId)} />;
}

function EditQuotationView({ quotationId }: { quotationId: number }) {
  const { data } = useSuspenseQuery(quotationByIdOptions(quotationId));

  if (!data) {
    notFound();
  }

  return <QuotationForm initialData={data as Quotation} pageTitle='Edit Quotation' />;
}
