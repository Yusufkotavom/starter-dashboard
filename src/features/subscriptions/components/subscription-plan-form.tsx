'use client';

import { useEffect } from 'react';
import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { useStore } from '@tanstack/react-form';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppForm, useFormFields } from '@/components/ui/tanstack-form';
import { productsQueryOptions } from '@/features/products/api/queries';
import { createSubscriptionPlanMutation, updateSubscriptionPlanMutation } from '../api/mutations';
import type { SubscriptionPlan } from '../api/types';
import { SUBSCRIPTION_INTERVAL_OPTIONS } from '../constants';
import {
  subscriptionPlanSchema,
  type SubscriptionPlanFormValues
} from '../schemas/subscription-plan';

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function SubscriptionPlanForm({
  initialData,
  pageTitle
}: {
  initialData: SubscriptionPlan | null;
  pageTitle: string;
}) {
  const router = useRouter();
  const isEdit = !!initialData;
  const { data: productData } = useSuspenseQuery(productsQueryOptions({ page: 1, limit: 1000 }));
  const services = productData.products.filter((product) => product.type === 'service');

  const serviceOptions = [
    { value: 0, label: 'No linked service' },
    ...services.map((service) => ({
      value: service.id,
      label: `${service.name} - ${service.price.toLocaleString('id-ID')}`
    }))
  ];

  const createMutation = useMutation({
    ...createSubscriptionPlanMutation,
    onSuccess: () => {
      toast.success('Subscription plan created');
      router.push('/dashboard/subscriptions');
      router.refresh();
    },
    onError: () => {
      toast.error('Failed to save subscription plan');
    }
  });

  const updateMutation = useMutation({
    ...updateSubscriptionPlanMutation,
    onSuccess: () => {
      toast.success('Subscription plan updated');
      router.push('/dashboard/subscriptions');
      router.refresh();
    },
    onError: () => {
      toast.error('Failed to save subscription plan');
    }
  });

  const form = useAppForm({
    defaultValues: {
      name: initialData?.name ?? '',
      slug: initialData?.slug ?? '',
      description: initialData?.description ?? null,
      serviceId: initialData?.serviceId ?? null,
      price: initialData?.price ?? 0,
      interval: initialData?.interval ?? 'MONTHLY',
      isActive: initialData?.isActive ?? true
    } as SubscriptionPlanFormValues,
    validators: {
      onSubmit: subscriptionPlanSchema
    },
    onSubmit: async ({ value }) => {
      const payload = {
        ...value,
        serviceId: value.serviceId && value.serviceId > 0 ? value.serviceId : null
      };

      if (isEdit) {
        await updateMutation.mutateAsync({ id: initialData.id, values: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
    }
  });

  const values = useStore(form.store, (state) => state.values);
  const { FormTextField, FormTextareaField, FormSelectField, FormSwitchField } =
    useFormFields<SubscriptionPlanFormValues>();

  useEffect(() => {
    if (isEdit) {
      return;
    }

    const currentSlug = form.getFieldValue('slug');
    const generatedSlug = slugify(values.name);

    if (!currentSlug || currentSlug === slugify(values.name)) {
      form.setFieldValue('slug', generatedSlug);
    }
  }, [form, isEdit, values.name]);

  useEffect(() => {
    const selectedService = services.find((service) => service.id === values.serviceId);

    if (!selectedService || isEdit) {
      return;
    }

    if (!values.price) {
      form.setFieldValue('price', selectedService.price);
    }
  }, [form, isEdit, services, values.price, values.serviceId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{pageTitle}</CardTitle>
      </CardHeader>
      <CardContent>
        <form.AppForm>
          <form.Form className='space-y-6'>
            <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
              <FormTextField name='name' label='Plan Name' required placeholder='Retainer Growth' />
              <FormTextField name='slug' label='Slug' required placeholder='retainer-growth' />
            </div>

            <FormTextareaField
              name='description'
              label='Description'
              placeholder='Monthly growth package for ongoing client work.'
              rows={4}
            />

            <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
              <FormSelectField name='serviceId' label='Linked Service' options={serviceOptions} />
              <FormTextField name='price' label='Recurring Price' required type='number' />
              <FormSelectField
                name='interval'
                label='Interval'
                required
                options={SUBSCRIPTION_INTERVAL_OPTIONS}
              />
            </div>

            <FormSwitchField
              name='isActive'
              label='Plan Active'
              description='Inactive plans stay in history but cannot be assigned to new clients.'
            />

            <div className='flex justify-end gap-2'>
              <Button type='button' variant='outline' onClick={() => router.back()}>
                Back
              </Button>
              <form.SubmitButton>
                {isEdit ? 'Update Subscription Plan' : 'Create Subscription Plan'}
              </form.SubmitButton>
            </div>
          </form.Form>
        </form.AppForm>
      </CardContent>
    </Card>
  );
}
