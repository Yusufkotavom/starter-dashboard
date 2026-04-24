'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
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
import { createInvoiceMutation, updateInvoiceMutation } from '../api/mutations';
import type { Invoice } from '../api/types';
import {
  INVOICE_CLIENT_OPTIONS,
  INVOICE_PROJECT_OPTIONS,
  INVOICE_STATUS_OPTIONS
} from '../constants';
import { invoiceSchema, type InvoiceFormValues } from '../schemas/invoice';

interface InvoiceFormSheetProps {
  invoice?: Invoice;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function toDateInputValue(value: string | null | undefined): string {
  return value ? value.slice(0, 10) : '';
}

export function InvoiceFormSheet({ invoice, open, onOpenChange }: InvoiceFormSheetProps) {
  const isEdit = !!invoice;

  const createMutation = useMutation({
    ...createInvoiceMutation,
    onSuccess: () => {
      toast.success('Invoice created successfully');
      onOpenChange(false);
      form.reset();
    },
    onError: () => toast.error('Failed to create invoice')
  });

  const updateMutation = useMutation({
    ...updateInvoiceMutation,
    onSuccess: () => {
      toast.success('Invoice updated successfully');
      onOpenChange(false);
    },
    onError: () => toast.error('Failed to update invoice')
  });

  const form = useAppForm({
    defaultValues: {
      number: invoice?.number ?? '',
      clientId: invoice?.clientId ?? Number(INVOICE_CLIENT_OPTIONS[0]?.value ?? 0),
      projectId: invoice?.projectId ?? 0,
      status: invoice?.status ?? 'DRAFT',
      total: invoice?.total ?? 0,
      dueDate: toDateInputValue(invoice?.dueDate),
      paidAt: toDateInputValue(invoice?.paidAt),
      notes: invoice?.notes ?? ''
    } as InvoiceFormValues,
    validators: {
      onSubmit: invoiceSchema
    },
    onSubmit: async ({ value }) => {
      const payload = {
        ...value,
        projectId: value.projectId === 0 ? null : value.projectId,
        dueDate: value.dueDate || null,
        paidAt: value.paidAt || null,
        notes: value.notes || null
      };

      if (isEdit) {
        await updateMutation.mutateAsync({ id: invoice.id, values: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
    }
  });

  const { FormTextField, FormSelectField, FormTextareaField } = useFormFields<InvoiceFormValues>();
  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='flex flex-col sm:max-w-xl'>
        <SheetHeader>
          <SheetTitle>{isEdit ? 'Edit Invoice' : 'New Invoice'}</SheetTitle>
          <SheetDescription>Track billable work and payment deadlines per client.</SheetDescription>
        </SheetHeader>

        <div className='flex-1 overflow-auto pe-4'>
          <form.AppForm>
            <form.Form id='invoice-form-sheet' className='space-y-4 py-4'>
              <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                <FormTextField name='number' label='Invoice Number' required />
                <FormSelectField
                  name='clientId'
                  label='Client'
                  required
                  options={INVOICE_CLIENT_OPTIONS}
                />
              </div>

              <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
                <FormSelectField
                  name='projectId'
                  label='Project'
                  required
                  options={INVOICE_PROJECT_OPTIONS}
                />
                <FormSelectField
                  name='status'
                  label='Status'
                  required
                  options={INVOICE_STATUS_OPTIONS}
                />
                <FormTextField name='total' label='Total Amount' required type='number' />
              </div>

              <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                <FormTextField name='dueDate' label='Due Date' type='date' />
                <FormTextField name='paidAt' label='Paid At' type='date' />
              </div>

              <FormTextareaField
                name='notes'
                label='Notes'
                rows={4}
                placeholder='Installment notes, billing scope, or reminders.'
              />
            </form.Form>
          </form.AppForm>
        </div>

        <SheetFooter className='mt-4'>
          <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type='submit' form='invoice-form-sheet' isLoading={isPending}>
            <Icons.check className='mr-2 h-4 w-4' />
            {isEdit ? 'Update Invoice' : 'Create Invoice'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export function InvoiceFormSheetTrigger() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Icons.add className='mr-2 h-4 w-4' />
        New Invoice
      </Button>
      <InvoiceFormSheet open={open} onOpenChange={setOpen} />
    </>
  );
}
