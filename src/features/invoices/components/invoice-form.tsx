'use client';

import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppForm, useFormFields } from '@/components/ui/tanstack-form';
import { clientsQueryOptions } from '@/features/clients/api/queries';
import { projectsQueryOptions } from '@/features/projects/api/queries';
import { createInvoiceMutation, updateInvoiceMutation } from '../api/mutations';
import type { Invoice } from '../api/types';
import { INVOICE_STATUS_OPTIONS } from '../constants';
import { invoiceSchema, type InvoiceFormValues } from '../schemas/invoice';

function toDateInputValue(value: string | null | undefined): string {
  return value ? value.slice(0, 10) : '';
}

export default function InvoiceForm({
  initialData,
  pageTitle
}: {
  initialData: Invoice | null;
  pageTitle: string;
}) {
  const router = useRouter();
  const isEdit = !!initialData;
  const { data: clientData } = useSuspenseQuery(clientsQueryOptions({ page: 1, limit: 1000 }));
  const { data: projectData } = useSuspenseQuery(projectsQueryOptions({ page: 1, limit: 1000 }));

  const clientOptions =
    clientData?.items.map((client) => ({
      value: client.id,
      label: client.company ? `${client.company} - ${client.name}` : client.name
    })) ?? [];
  const projectOptions = [
    { value: 0, label: 'No linked project' },
    ...(projectData?.items.map((project) => ({
      value: project.id,
      label: project.name
    })) ?? [])
  ];

  const createMutation = useMutation({
    ...createInvoiceMutation,
    onSuccess: () => {
      toast.success('Invoice created successfully');
      router.push('/dashboard/invoices');
    },
    onError: () => toast.error('Failed to create invoice')
  });

  const updateMutation = useMutation({
    ...updateInvoiceMutation,
    onSuccess: () => {
      toast.success('Invoice updated successfully');
      router.push('/dashboard/invoices');
    },
    onError: () => toast.error('Failed to update invoice')
  });

  const form = useAppForm({
    defaultValues: {
      number: initialData?.number ?? '',
      clientId: initialData?.clientId ?? Number(clientOptions[0]?.value ?? 0),
      projectId: initialData?.projectId ?? 0,
      status: initialData?.status ?? 'DRAFT',
      total: initialData?.total ?? 0,
      dueDate: toDateInputValue(initialData?.dueDate),
      paidAt: toDateInputValue(initialData?.paidAt),
      notes: initialData?.notes ?? ''
    } as InvoiceFormValues,
    validators: { onSubmit: invoiceSchema },
    onSubmit: async ({ value }) => {
      const payload = {
        ...value,
        projectId: value.projectId === 0 ? null : value.projectId,
        dueDate: value.dueDate || null,
        paidAt: value.paidAt || null,
        notes: value.notes || null
      };

      if (isEdit) {
        await updateMutation.mutateAsync({ id: initialData.id, values: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
    }
  });

  const { FormTextField, FormSelectField, FormTextareaField } = useFormFields<InvoiceFormValues>();

  return (
    <Card className='mx-auto w-full'>
      <CardHeader>
        <CardTitle className='text-2xl font-bold'>{pageTitle}</CardTitle>
      </CardHeader>
      <CardContent>
        <form.AppForm>
          <form.Form className='space-y-6'>
            <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
              <FormTextField name='number' label='Invoice Number' required />
              <FormSelectField name='clientId' label='Client' required options={clientOptions} />
            </div>

            <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
              <FormSelectField name='projectId' label='Project' required options={projectOptions} />
              <FormSelectField
                name='status'
                label='Status'
                required
                options={INVOICE_STATUS_OPTIONS}
              />
              <FormTextField name='total' label='Total Amount' required type='number' />
            </div>

            <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
              <FormTextField name='dueDate' label='Due Date' type='date' />
              <FormTextField name='paidAt' label='Paid At' type='date' />
            </div>

            <FormTextareaField
              name='notes'
              label='Notes'
              rows={5}
              placeholder='Installment notes, billing scope, or reminders.'
            />

            <div className='flex justify-end gap-2'>
              <Button type='button' variant='outline' onClick={() => router.back()}>
                Back
              </Button>
              <form.SubmitButton>{isEdit ? 'Update Invoice' : 'Create Invoice'}</form.SubmitButton>
            </div>
          </form.Form>
        </form.AppForm>
      </CardContent>
    </Card>
  );
}
