'use client';

import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppForm, useFormFields } from '@/components/ui/tanstack-form';
import { invoicesQueryOptions } from '@/features/invoices/api/queries';
import { createPaymentMutation, updatePaymentMutation } from '../api/mutations';
import type { Payment } from '../api/types';
import { PAYMENT_METHOD_OPTIONS } from '../constants';
import { paymentSchema, type PaymentFormValues } from '../schemas/payment';

function toDateInputValue(value: string | null | undefined): string {
  return value ? value.slice(0, 10) : '';
}

export default function PaymentForm({
  initialData,
  pageTitle
}: {
  initialData: Payment | null;
  pageTitle: string;
}) {
  const router = useRouter();
  const isEdit = !!initialData;
  const { data: invoiceData } = useSuspenseQuery(invoicesQueryOptions({ page: 1, limit: 1000 }));
  const invoiceOptions =
    invoiceData?.items.map((invoice) => ({
      value: invoice.id,
      label: `${invoice.number} - ${invoice.clientName} - due ${invoice.balanceDue.toLocaleString('id-ID')}`
    })) ?? [];

  const createMutation = useMutation({
    ...createPaymentMutation,
    onSuccess: () => {
      toast.success('Payment recorded successfully');
      router.push('/dashboard/payments');
    },
    onError: () => toast.error('Failed to record payment')
  });

  const updateMutation = useMutation({
    ...updatePaymentMutation,
    onSuccess: () => {
      toast.success('Payment updated successfully');
      router.push('/dashboard/payments');
    },
    onError: () => toast.error('Failed to update payment')
  });

  const form = useAppForm({
    defaultValues: {
      invoiceId: initialData?.invoiceId ?? Number(invoiceOptions[0]?.value ?? 0),
      amount: initialData?.amount ?? 0,
      method: initialData?.method ?? 'BANK_TRANSFER',
      reference: initialData?.reference ?? '',
      paidAt: toDateInputValue(initialData?.paidAt),
      notes: initialData?.notes ?? ''
    } as PaymentFormValues,
    validators: { onSubmit: paymentSchema },
    onSubmit: async ({ value }) => {
      const payload = {
        ...value,
        reference: value.reference || null,
        notes: value.notes || null
      };

      if (isEdit) {
        await updateMutation.mutateAsync({ id: initialData.id, values: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
    }
  });

  const { FormTextField, FormSelectField, FormTextareaField } = useFormFields<PaymentFormValues>();

  return (
    <Card className='mx-auto w-full'>
      <CardHeader>
        <CardTitle className='text-2xl font-bold'>{pageTitle}</CardTitle>
      </CardHeader>
      <CardContent>
        <form.AppForm>
          <form.Form className='space-y-6'>
            <FormSelectField name='invoiceId' label='Invoice' required options={invoiceOptions} />

            <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
              <FormTextField name='amount' label='Amount' required type='number' />
              <FormSelectField
                name='method'
                label='Method'
                required
                options={PAYMENT_METHOD_OPTIONS}
              />
            </div>

            <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
              <FormTextField name='reference' label='Reference' />
              <FormTextField name='paidAt' label='Paid At' required type='date' />
            </div>

            <FormTextareaField name='notes' label='Notes' rows={5} />

            <div className='flex justify-end gap-2'>
              <Button type='button' variant='outline' onClick={() => router.back()}>
                Back
              </Button>
              <form.SubmitButton>{isEdit ? 'Update Payment' : 'Save Payment'}</form.SubmitButton>
            </div>
          </form.Form>
        </form.AppForm>
      </CardContent>
    </Card>
  );
}
