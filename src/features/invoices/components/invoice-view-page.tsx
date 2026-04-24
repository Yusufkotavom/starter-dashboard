'use client';

import { notFound } from 'next/navigation';
import { useSuspenseQuery } from '@tanstack/react-query';
import type { Invoice } from '../api/types';
import { invoiceByIdOptions } from '../api/queries';
import InvoiceForm from './invoice-form';

export default function InvoiceViewPage({ invoiceId }: { invoiceId: string }) {
  if (invoiceId === 'new') {
    return <InvoiceForm initialData={null} pageTitle='Create Invoice' />;
  }

  return <EditInvoiceView invoiceId={Number(invoiceId)} />;
}

function EditInvoiceView({ invoiceId }: { invoiceId: number }) {
  const { data } = useSuspenseQuery(invoiceByIdOptions(invoiceId));

  if (!data) {
    notFound();
  }

  return <InvoiceForm initialData={data as Invoice} pageTitle='Edit Invoice' />;
}
