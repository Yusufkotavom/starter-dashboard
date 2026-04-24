'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { clientsQueryOptions } from '@/features/clients/api/queries';
import { useAppForm, useFormFields } from '@/components/ui/tanstack-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { attachCommunicationClientMutation } from '../api/mutations';
import type { CommunicationClientRef } from '../api/types';
import { attachClientSchema, type AttachClientFormValues } from '../schemas/communication';

interface AttachClientFormProps {
  communicationId: number;
  currentClient: CommunicationClientRef | null;
}

export function AttachClientForm({ communicationId, currentClient }: AttachClientFormProps) {
  const { data: clientData, isLoading } = useQuery(clientsQueryOptions({ page: 1, limit: 1000 }));
  const attachMutation = useMutation({
    ...attachCommunicationClientMutation,
    onSuccess: () => {
      toast.success(currentClient ? 'Client link updated' : 'Conversation attached to client');
    },
    onError: () => {
      toast.error('Failed to attach client');
    }
  });

  const clientOptions =
    clientData?.items.map((client) => ({
      value: client.id,
      label: client.company ? `${client.company} - ${client.name}` : client.name
    })) ?? [];

  const form = useAppForm({
    defaultValues: {
      clientId: currentClient?.id ?? Number(clientOptions[0]?.value ?? 0)
    } as AttachClientFormValues,
    validators: {
      onSubmit: attachClientSchema
    },
    onSubmit: async ({ value }) => {
      await attachMutation.mutateAsync({
        id: communicationId,
        values: {
          clientId: value.clientId
        }
      });
    }
  });

  const { FormSelectField } = useFormFields<AttachClientFormValues>();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Attach to client</CardTitle>
        <CardDescription>
          Link this WhatsApp thread to an existing client record for downstream sales and support
          workflows.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form.AppForm>
          <form.Form className='space-y-4'>
            <FormSelectField
              name='clientId'
              label='Client'
              required
              options={clientOptions}
              placeholder={isLoading ? 'Loading clients...' : 'Select client'}
            />
            <form.SubmitButton className='w-full'>
              {currentClient ? 'Update Client Link' : 'Attach Client'}
            </form.SubmitButton>
          </form.Form>
        </form.AppForm>
      </CardContent>
    </Card>
  );
}
