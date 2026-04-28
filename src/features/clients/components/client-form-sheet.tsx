'use client';

import { useState } from 'react';
import { useAppForm, useFormFields } from '@/components/ui/tanstack-form';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';
import { Icons } from '@/components/icons';
import { useMutation } from '@tanstack/react-query';
import { createClientMutation, updateClientMutation } from '../api/mutations';
import { clientKeys } from '../api/queries';
import type { Client } from '../api/types';
import { toast } from 'sonner';
import { clientSchema, type ClientFormValues } from '../schemas/client';
import { CLIENT_STATUS_OPTIONS } from '../constants';
import { getQueryClient } from '@/lib/query-client';

interface ClientFormSheetProps {
  client?: Client;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ClientFormSheet({ client, open, onOpenChange }: ClientFormSheetProps) {
  const isEdit = !!client;

  const createMutation = useMutation({
    ...createClientMutation,
    onSuccess: () => {
      getQueryClient().invalidateQueries({ queryKey: clientKeys.all });
      toast.success('Client created successfully');
      onOpenChange(false);
      form.reset();
    },
    onError: () => toast.error('Failed to create client')
  });

  const updateMutation = useMutation({
    ...updateClientMutation,
    onSuccess: () => {
      getQueryClient().invalidateQueries({ queryKey: clientKeys.all });
      toast.success('Client updated successfully');
      onOpenChange(false);
    },
    onError: () => toast.error('Failed to update client')
  });

  const form = useAppForm({
    defaultValues: {
      name: client?.name ?? '',
      email: client?.email ?? '',
      phone: client?.phone ?? '',
      company: client?.company ?? '',
      address: client?.address ?? '',
      status: client?.status ?? 'LEAD',
      notes: client?.notes ?? ''
    } as ClientFormValues,
    validators: {
      onSubmit: clientSchema
    },
    onSubmit: async ({ value }) => {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: client.id, values: value });
      } else {
        await createMutation.mutateAsync(value);
      }
    }
  });

  const { FormTextField, FormSelectField, FormTextareaField } = useFormFields<ClientFormValues>();

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='flex flex-col sm:max-w-md'>
        <SheetHeader>
          <SheetTitle>{isEdit ? 'Edit Client' : 'New Client'}</SheetTitle>
          <SheetDescription>
            {isEdit
              ? 'Update the client details below.'
              : 'Fill in the details to create a new client.'}
          </SheetDescription>
        </SheetHeader>

        <div className='flex-1 overflow-auto pe-4'>
          <form.AppForm>
            <form.Form id='client-form-sheet' className='space-y-4 py-4'>
              <FormTextField
                name='name'
                label='Name / Contact Person'
                required
                placeholder='John Doe'
              />

              <FormTextField
                name='email'
                label='Email'
                required
                type='email'
                placeholder='john@company.com'
              />

              <FormTextField name='phone' label='Phone' type='tel' placeholder='+62...' />

              <FormTextField
                name='company'
                label='Company Name'
                placeholder='PT Teknologi Nusantara'
              />

              <FormSelectField
                name='status'
                label='Status'
                required
                options={CLIENT_STATUS_OPTIONS}
                placeholder='Select status'
              />

              <FormTextareaField
                name='address'
                label='Address'
                placeholder='Jl. Sudirman...'
                rows={2}
              />

              <FormTextareaField
                name='notes'
                label='Internal Notes'
                placeholder='Lead from Facebook Ads...'
                rows={3}
              />
            </form.Form>
          </form.AppForm>
        </div>

        <SheetFooter className='mt-4'>
          <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type='submit' form='client-form-sheet' isLoading={isPending}>
            <Icons.check className='mr-2' /> {isEdit ? 'Update Client' : 'Create Client'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export function ClientFormSheetTrigger() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Icons.add className='mr-2 h-4 w-4' /> New Client
      </Button>
      <ClientFormSheet open={open} onOpenChange={setOpen} />
    </>
  );
}
