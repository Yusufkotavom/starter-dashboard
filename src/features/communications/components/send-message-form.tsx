'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAppForm, useFormFields } from '@/components/ui/tanstack-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { sendCommunicationMessageMutation } from '../api/mutations';
import { sendMessageSchema, type SendMessageFormValues } from '../schemas/communication';

interface SendMessageFormProps {
  communicationId: number;
}

export function SendMessageForm({ communicationId }: SendMessageFormProps) {
  const sendMutation = useMutation({
    ...sendCommunicationMessageMutation,
    onSuccess: () => {
      toast.success('Message queued for delivery');
      form.reset();
    },
    onError: () => {
      toast.error('Failed to send message');
    }
  });

  const form = useAppForm({
    defaultValues: {
      body: ''
    } as SendMessageFormValues,
    validators: {
      onSubmit: sendMessageSchema
    },
    onSubmit: async ({ value }) => {
      await sendMutation.mutateAsync({
        id: communicationId,
        values: value
      });
    }
  });

  const { FormTextareaField } = useFormFields<SendMessageFormValues>();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Send message</CardTitle>
        <CardDescription>
          Reply directly to the WhatsApp thread. New outbound messages will appear in the timeline
          after the API acknowledges the send request.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form.AppForm>
          <form.Form className='space-y-4'>
            <FormTextareaField
              name='body'
              label='Message'
              required
              rows={7}
              placeholder='Type the next reply for this contact.'
            />
            <form.SubmitButton className='w-full'>Send WhatsApp Message</form.SubmitButton>
          </form.Form>
        </form.AppForm>
      </CardContent>
    </Card>
  );
}
