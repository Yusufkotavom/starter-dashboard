'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import * as z from 'zod';
import { Icons } from '@/components/icons';
import { useAppForm, useFormFields } from '@/components/ui/tanstack-form';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createProductMutation, updateProductMutation } from '../api/mutations';
import type { Product } from '../api/types';
import { productSchema, type ProductFormValues } from '@/features/products/schemas/product';
import { categoryOptions } from '@/features/products/constants/product-options';
import type { SubscriptionInterval } from '@/features/subscriptions/api/types';

type ProductPlanDraft = NonNullable<Product['subscriptionPlans']>[number];

const intervalOptions: Array<{ value: SubscriptionInterval; label: string }> = [
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'QUARTERLY', label: 'Quarterly' },
  { value: 'YEARLY', label: 'Yearly' }
];

function createEmptyPlan(name?: string): ProductPlanDraft {
  return {
    name: name ? `${name} Plan` : '',
    description: '',
    interval: 'MONTHLY',
    price: 0,
    isActive: true,
    activeSubscriptions: 0
  };
}

async function uploadProductImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/uploads/product-image', {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    throw new Error('Failed to upload product image');
  }

  const payload = (await response.json()) as { url: string };
  return payload.url;
}

export default function ProductForm({
  initialData,
  pageTitle
}: {
  initialData: Product | null;
  pageTitle: string;
}) {
  const router = useRouter();
  const isEdit = !!initialData;
  const [plans, setPlans] = useState<ProductPlanDraft[]>(
    initialData?.subscriptionPlans?.length ? initialData.subscriptionPlans : []
  );

  const createMutation = useMutation({
    ...createProductMutation,
    onSuccess: () => {
      toast.success('Product created successfully');
      router.push('/dashboard/product');
    },
    onError: () => {
      toast.error('Failed to create product');
    }
  });

  const updateMutation = useMutation({
    ...updateProductMutation,
    onSuccess: () => {
      toast.success('Product updated successfully');
      router.push('/dashboard/product');
    },
    onError: () => {
      toast.error('Failed to update product');
    }
  });

  const form = useAppForm({
    defaultValues: {
      image: undefined,
      name: initialData?.name ?? '',
      category: initialData?.category ?? '',
      type: initialData?.type ?? 'product',
      isDigital: initialData?.isDigital ?? false,
      deliveryUrl: initialData?.deliveryUrl ?? '',
      price: initialData?.price,
      description: initialData?.description ?? ''
    } as ProductFormValues,
    validators: {
      onSubmit: productSchema
    },
    onSubmit: async ({ value }) => {
      let photoUrl = initialData?.photo_url ?? null;

      if (value.image?.[0]) {
        photoUrl = await uploadProductImage(value.image[0]);
      }

      const payload = {
        name: value.name,
        category: value.category,
        type: value.type,
        isDigital: value.isDigital,
        deliveryUrl: value.deliveryUrl || null,
        price: value.price!,
        description: value.description,
        photoUrl,
        recurringPlans: plans
      };

      if (isEdit) {
        await updateMutation.mutateAsync({ id: initialData.id, values: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
    }
  });

  const {
    FormTextField,
    FormSelectField,
    FormTextareaField,
    FormFileUploadField,
    FormSwitchField
  } = useFormFields<ProductFormValues>();

  return (
    <Card className='mx-auto w-full'>
      <CardHeader>
        <CardTitle className='text-left text-2xl font-bold'>{pageTitle}</CardTitle>
      </CardHeader>
      <CardContent>
        <form.AppForm>
          <form.Form className='space-y-8'>
            <FormFileUploadField
              name='image'
              label='Product Image'
              description='Upload a product image'
              maxSize={5 * 1024 * 1024}
              maxFiles={4}
            />

            <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
              <FormTextField
                name='name'
                label='Product Name'
                required
                placeholder='Enter product name'
                validators={{
                  onBlur: z.string().min(2, 'Product name must be at least 2 characters.')
                }}
              />

              <FormSelectField
                name='category'
                label='Category'
                required
                options={categoryOptions}
                placeholder='Select category'
                validators={{
                  onBlur: z.string().min(1, 'Please select a category')
                }}
              />

              <FormSelectField
                name='type'
                label='Catalog Type'
                required
                options={[
                  { label: 'Product', value: 'product' },
                  { label: 'Service', value: 'service' }
                ]}
                placeholder='Select type'
                validators={{
                  onBlur: z.enum(['product', 'service'])
                }}
              />

              <FormTextField
                name='price'
                label='Base Price'
                required
                type='number'
                min={0}
                step={0.01}
                placeholder='Enter price'
                validators={{
                  onBlur: z.number({ message: 'Price is required' })
                }}
              />
            </div>

            <FormTextareaField
              name='description'
              label='Description'
              required
              placeholder='Enter product description'
              maxLength={500}
              rows={4}
              validators={{
                onBlur: z.string().min(10, 'Description must be at least 10 characters.')
              }}
            />

            <div className='grid gap-4 md:grid-cols-2'>
              <FormSwitchField
                name='isDigital'
                label='Digital Delivery'
                description='Enable this when the product includes a digital asset, portal access, or delivery URL.'
              />
              <FormTextField
                name='deliveryUrl'
                label='Digital Delivery URL'
                placeholder='https://...'
              />
            </div>

            <div className='space-y-4 rounded-xl border p-4'>
              <div className='flex items-center justify-between gap-4'>
                <div>
                  <div className='font-medium'>Recurring Plans</div>
                  <div className='text-muted-foreground text-sm'>
                    Configure subscription plans inside this service/product. Existing plans with
                    active subscribers will be archived instead of deleted.
                  </div>
                </div>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() =>
                    setPlans((current) => [
                      ...current,
                      createEmptyPlan(form.getFieldValue('name') || initialData?.name)
                    ])
                  }
                >
                  <Icons.add className='mr-2 h-4 w-4' />
                  Add Plan
                </Button>
              </div>

              {plans.length === 0 ? (
                <div className='text-muted-foreground rounded-lg border border-dashed p-4 text-sm'>
                  No recurring plans yet. Add one if this item should support retainers or
                  subscriptions.
                </div>
              ) : (
                <div className='space-y-4'>
                  {plans.map((plan, index) => (
                    <div
                      key={plan.id ?? `draft-${index}`}
                      className='space-y-3 rounded-lg border p-4'
                    >
                      <div className='flex items-center justify-between gap-3'>
                        <div className='flex items-center gap-2'>
                          <div className='font-medium'>Plan {index + 1}</div>
                          {plan.id ? <Badge variant='outline'>Existing</Badge> : null}
                          {plan.activeSubscriptions ? (
                            <Badge variant='secondary'>
                              {plan.activeSubscriptions} active subscriptions
                            </Badge>
                          ) : null}
                        </div>
                        <Button
                          type='button'
                          variant='ghost'
                          size='sm'
                          onClick={() =>
                            setPlans((current) =>
                              current.filter((_, currentIndex) => currentIndex !== index)
                            )
                          }
                        >
                          <Icons.trash className='mr-2 h-4 w-4' />
                          Remove
                        </Button>
                      </div>

                      <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
                        <div className='space-y-2 xl:col-span-2'>
                          <label htmlFor={`plan-name-${index}`} className='text-sm font-medium'>
                            Plan Name
                          </label>
                          <input
                            id={`plan-name-${index}`}
                            className='border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2'
                            value={plan.name}
                            onChange={(event) =>
                              setPlans((current) =>
                                current.map((item, itemIndex) =>
                                  itemIndex === index ? { ...item, name: event.target.value } : item
                                )
                              )
                            }
                            placeholder='Monthly Retainer'
                          />
                        </div>
                        <div className='space-y-2'>
                          <label htmlFor={`plan-interval-${index}`} className='text-sm font-medium'>
                            Interval
                          </label>
                          <select
                            id={`plan-interval-${index}`}
                            className='border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2'
                            value={plan.interval}
                            onChange={(event) =>
                              setPlans((current) =>
                                current.map((item, itemIndex) =>
                                  itemIndex === index
                                    ? {
                                        ...item,
                                        interval: event.target.value as SubscriptionInterval
                                      }
                                    : item
                                )
                              )
                            }
                          >
                            {intervalOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className='space-y-2'>
                          <label htmlFor={`plan-price-${index}`} className='text-sm font-medium'>
                            Plan Price
                          </label>
                          <input
                            id={`plan-price-${index}`}
                            className='border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2'
                            type='number'
                            min={0}
                            step='0.01'
                            value={plan.price}
                            onChange={(event) =>
                              setPlans((current) =>
                                current.map((item, itemIndex) =>
                                  itemIndex === index
                                    ? { ...item, price: Number(event.target.value) || 0 }
                                    : item
                                )
                              )
                            }
                          />
                        </div>
                      </div>

                      <div className='grid gap-4 md:grid-cols-[1fr_auto]'>
                        <div className='space-y-2'>
                          <label
                            htmlFor={`plan-description-${index}`}
                            className='text-sm font-medium'
                          >
                            Plan Description
                          </label>
                          <textarea
                            id={`plan-description-${index}`}
                            className='border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-24 w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2'
                            value={plan.description ?? ''}
                            onChange={(event) =>
                              setPlans((current) =>
                                current.map((item, itemIndex) =>
                                  itemIndex === index
                                    ? { ...item, description: event.target.value }
                                    : item
                                )
                              )
                            }
                            placeholder='What is included in this recurring plan?'
                          />
                        </div>
                        <label className='flex items-center gap-3 self-start rounded-lg border px-4 py-3 text-sm'>
                          <input
                            type='checkbox'
                            checked={plan.isActive}
                            onChange={(event) =>
                              setPlans((current) =>
                                current.map((item, itemIndex) =>
                                  itemIndex === index
                                    ? { ...item, isActive: event.target.checked }
                                    : item
                                )
                              )
                            }
                          />
                          Active Plan
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className='flex justify-end gap-2'>
              <Button type='button' variant='outline' onClick={() => router.back()}>
                Back
              </Button>
              <form.SubmitButton>{isEdit ? 'Update Service' : 'Add Service'}</form.SubmitButton>
            </div>
          </form.Form>
        </form.AppForm>
      </CardContent>
    </Card>
  );
}
