'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { useAppForm, useFormFields } from '@/components/ui/tanstack-form';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';
import { createPaymentMutation, updatePaymentMutation } from '../api/mutations';
import type { Payment } from '../api/types';
import { invoicesQueryOptions } from '@/features/invoices/api/queries';
import { PAYMENT_METHOD_OPTIONS } from '../constants';
import { paymentSchema, type PaymentFormValues } from '../schemas/payment';

interface PaymentFormSheetProps {
  payment?: Payment;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function toDateInputValue(value: string | null | undefined): string {
  return value ? value.slice(0, 10) : '';
}

export function PaymentFormSheet({ payment, open, onOpenChange }: PaymentFormSheetProps) {
  const isEdit = !!payment;
  const { data: invoiceData } = useQuery(invoicesQueryOptions({ page: 1, limit: 1000 }));
  const invoiceOptions =
    invoiceData?.items.map((invoice) => ({
      value: invoice.id,
      label: `${invoice.number} - ${invoice.clientName} - due ${invoice.balanceDue.toLocaleString('id-ID')}`
    })) ?? [];

  const createMutation = useMutation({
    ...createPaymentMutation,
    onSuccess: () => {
      toast.success('Payment recorded successfully');
      onOpenChange(false);
      form.reset();
    },
    onError: () => toast.error('Failed to record payment')
  });

  const updateMutation = useMutation({
    ...updatePaymentMutation,
    onSuccess: () => {
      toast.success('Payment updated successfully');
      onOpenChange(false);
    },
    onError: () => toast.error('Failed to update payment')
  });

  const form = useAppForm({
    defaultValues: {
      invoiceId: payment?.invoiceId ?? Number(invoiceOptions[0]?.value ?? 0),
      amount: payment?.amount ?? 0,
      method: payment?.method ?? 'BANK_TRANSFER',
      reference: payment?.reference ?? '',
      paidAt: toDateInputValue(payment?.paidAt),
      notes: payment?.notes ?? ''
    } as PaymentFormValues,
    validators: {
      onSubmit: paymentSchema
    },
    onSubmit: async ({ value }) => {
      const payload = {
        ...value,
        reference: value.reference || null,
        notes: value.notes || null
      };

      if (isEdit) {
        await updateMutation.mutateAsync({ id: payment.id, values: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
    }
  });

  const { FormTextField, FormSelectField, FormTextareaField } = useFormFields<PaymentFormValues>();
  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='flex flex-col sm:max-w-xl'>
        <SheetHeader>
          <SheetTitle>{isEdit ? 'Edit Payment' : 'Record Payment'}</SheetTitle>
          <SheetDescription>Capture settlement history for sent invoices.</SheetDescription>
        </SheetHeader>

        <div className='flex-1 overflow-auto pe-4'>
          <form.AppForm>
            <form.Form id='payment-form-sheet' className='space-y-4 py-4'>
              <FormSelectField name='invoiceId' label='Invoice' required options={invoiceOptions} />

              <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                <FormTextField name='amount' label='Amount' required type='number' />
                <FormSelectField
                  name='method'
                  label='Method'
                  required
                  options={PAYMENT_METHOD_OPTIONS}
                />
              </div>

              <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                <FormTextField name='reference' label='Reference' />
                <FormTextField name='paidAt' label='Paid At' required type='date' />
              </div>

              <FormTextareaField name='notes' label='Notes' rows={4} />
            </form.Form>
          </form.AppForm>
        </div>

        <SheetFooter className='mt-4'>
          <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type='submit' form='payment-form-sheet' isLoading={isPending}>
            <Icons.check className='mr-2 h-4 w-4' />
            {isEdit ? 'Update Payment' : 'Save Payment'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export function PaymentFormSheetTrigger() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Icons.add className='mr-2 h-4 w-4' />
        Record Payment
      </Button>
      <PaymentFormSheet open={open} onOpenChange={setOpen} />
    </>
  );
}
