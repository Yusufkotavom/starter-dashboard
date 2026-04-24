'use client';

import { useEffect } from 'react';
import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { useStore } from '@tanstack/react-form';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppForm, useFormFields } from '@/components/ui/tanstack-form';
import { clientsQueryOptions } from '@/features/clients/api/queries';
import { projectsQueryOptions } from '@/features/projects/api/queries';
import { subscriptionPlansQueryOptions } from '../api/queries';
import {
  createClientSubscriptionMutation,
  updateClientSubscriptionMutation
} from '../api/mutations';
import type { ClientSubscription } from '../api/types';
import { SUBSCRIPTION_STATUS_OPTIONS } from '../constants';
import {
  clientSubscriptionSchema,
  type ClientSubscriptionFormValues
} from '../schemas/client-subscription';

function toDateInputValue(value: string | null | undefined): string {
  return value ? value.slice(0, 10) : '';
}

function addMonths(date: string, count: number): string {
  const base = new Date(`${date}T00:00:00.000Z`);
  base.setUTCMonth(base.getUTCMonth() + count);
  return base.toISOString().slice(0, 10);
}

function calculateNextBillingDate(startDate: string, interval: string): string | null {
  if (!startDate) {
    return null;
  }

  if (interval === 'WEEKLY') {
    const base = new Date(`${startDate}T00:00:00.000Z`);
    base.setUTCDate(base.getUTCDate() + 7);
    return base.toISOString().slice(0, 10);
  }

  if (interval === 'QUARTERLY') {
    return addMonths(startDate, 3);
  }

  if (interval === 'YEARLY') {
    return addMonths(startDate, 12);
  }

  return addMonths(startDate, 1);
}

export default function ClientSubscriptionForm({
  initialData,
  pageTitle,
  serviceId,
  returnPath
}: {
  initialData: ClientSubscription | null;
  pageTitle: string;
  serviceId?: number;
  returnPath?: string;
}) {
  const router = useRouter();
  const isEdit = !!initialData;
  const { data: clientData } = useSuspenseQuery(clientsQueryOptions({ page: 1, limit: 1000 }));
  const { data: planData } = useSuspenseQuery(
    subscriptionPlansQueryOptions({ page: 1, limit: 1000 })
  );
  const { data: projectData } = useSuspenseQuery(projectsQueryOptions({ page: 1, limit: 1000 }));

  const clientOptions = clientData.items.map((client) => ({
    value: client.id,
    label: client.company ? `${client.name} - ${client.company}` : client.name
  }));

  const scopedPlans = serviceId
    ? planData.items.filter((plan) => plan.serviceId === serviceId)
    : planData.items;

  const planOptions = scopedPlans.map((plan) => ({
    value: plan.id,
    label: `${plan.name} - ${plan.interval} - ${plan.price.toLocaleString('id-ID')}`
  }));

  const projectOptions = [
    { value: 0, label: 'No linked project' },
    ...projectData.items.map((project) => ({
      value: project.id,
      label: project.clientCompany ? `${project.name} - ${project.clientCompany}` : project.name
    }))
  ];

  const createMutation = useMutation({
    ...createClientSubscriptionMutation,
    onSuccess: () => {
      toast.success('Client subscription created');
      router.push(returnPath ?? '/dashboard/subscriptions');
      router.refresh();
    },
    onError: () => {
      toast.error('Failed to save client subscription');
    }
  });

  const updateMutation = useMutation({
    ...updateClientSubscriptionMutation,
    onSuccess: () => {
      toast.success('Client subscription updated');
      router.push(returnPath ?? '/dashboard/subscriptions');
      router.refresh();
    },
    onError: () => {
      toast.error('Failed to save client subscription');
    }
  });

  const form = useAppForm({
    defaultValues: {
      clientId: initialData?.clientId ?? 0,
      planId: initialData?.planId ?? 0,
      projectId: initialData?.projectId ?? null,
      status: initialData?.status ?? 'ACTIVE',
      startDate: toDateInputValue(initialData?.startDate),
      nextBillingDate: toDateInputValue(initialData?.nextBillingDate),
      endDate: toDateInputValue(initialData?.endDate),
      autoRenew: initialData?.autoRenew ?? true,
      priceOverride: initialData?.priceOverride ?? null,
      notes: initialData?.notes ?? null
    } as ClientSubscriptionFormValues,
    validators: {
      onSubmit: clientSubscriptionSchema
    },
    onSubmit: async ({ value }) => {
      const payload = {
        ...value,
        projectId: value.projectId && value.projectId > 0 ? value.projectId : null,
        nextBillingDate: value.nextBillingDate || null,
        endDate: value.endDate || null,
        priceOverride:
          typeof value.priceOverride === 'number' && value.priceOverride > 0
            ? value.priceOverride
            : null
      };

      if (isEdit) {
        await updateMutation.mutateAsync({ id: initialData.id, values: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
    }
  });

  const values = useStore(form.store, (state) => state.values);
  const selectedPlan = scopedPlans.find((plan) => plan.id === values.planId);
  const selectedProject = projectData.items.find((project) => project.id === values.projectId);
  const { FormTextField, FormTextareaField, FormSelectField, FormSwitchField } =
    useFormFields<ClientSubscriptionFormValues>();

  useEffect(() => {
    if (!values.startDate || !selectedPlan || isEdit || values.nextBillingDate) {
      return;
    }

    const nextBillingDate = calculateNextBillingDate(values.startDate, selectedPlan.interval);
    form.setFieldValue('nextBillingDate', nextBillingDate);
  }, [form, isEdit, selectedPlan, values.nextBillingDate, values.startDate]);

  useEffect(() => {
    if (!selectedProject || values.clientId) {
      return;
    }

    form.setFieldValue('clientId', selectedProject.clientId);
  }, [form, selectedProject, values.clientId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{pageTitle}</CardTitle>
      </CardHeader>
      <CardContent>
        <form.AppForm>
          <form.Form className='space-y-6'>
            <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
              <FormSelectField name='clientId' label='Client' required options={clientOptions} />
              <FormSelectField name='planId' label='Plan' required options={planOptions} />
              <FormSelectField name='projectId' label='Project' options={projectOptions} />
            </div>

            {selectedPlan ? (
              <div className='text-muted-foreground rounded-lg border p-4 text-sm'>
                Default plan price is {selectedPlan.price.toLocaleString('id-ID')} billed{' '}
                {selectedPlan.interval.toLowerCase()}.
              </div>
            ) : null}

            <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
              <FormSelectField
                name='status'
                label='Status'
                required
                options={SUBSCRIPTION_STATUS_OPTIONS}
              />
              <FormTextField name='startDate' label='Start Date' required type='date' />
              <FormTextField name='nextBillingDate' label='Next Billing Date' type='date' />
            </div>

            <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
              <FormTextField name='endDate' label='End Date' type='date' />
              <FormTextField name='priceOverride' label='Price Override' type='number' />
              <FormSwitchField
                name='autoRenew'
                label='Auto Renew'
                description='Generate future invoices using the recurring schedule.'
              />
            </div>

            <FormTextareaField
              name='notes'
              label='Notes'
              placeholder='Contract notes, billing caveats, or scope reminders.'
              rows={5}
            />

            <div className='flex justify-end gap-2'>
              <Button type='button' variant='outline' onClick={() => router.back()}>
                Back
              </Button>
              <form.SubmitButton>
                {isEdit ? 'Update Client Subscription' : 'Create Client Subscription'}
              </form.SubmitButton>
            </div>
          </form.Form>
        </form.AppForm>
      </CardContent>
    </Card>
  );
}
