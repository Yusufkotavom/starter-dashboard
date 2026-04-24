'use client';

import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppForm, useFormFields } from '@/components/ui/tanstack-form';
import { clientsQueryOptions } from '@/features/clients/api/queries';
import { productsQueryOptions } from '@/features/products/api/queries';
import { createQuotationMutation, updateQuotationMutation } from '../api/mutations';
import type { Quotation } from '../api/types';
import { QUOTATION_STATUS_OPTIONS } from '../constants';
import { quotationSchema, type QuotationFormValues } from '../schemas/quotation';

function toDateInputValue(value: string | null | undefined): string {
  return value ? value.slice(0, 10) : '';
}

export default function QuotationForm({
  initialData,
  pageTitle
}: {
  initialData: Quotation | null;
  pageTitle: string;
}) {
  const router = useRouter();
  const isEdit = !!initialData;
  const { data: clientData } = useSuspenseQuery(clientsQueryOptions({ page: 1, limit: 1000 }));
  const { data: productData } = useSuspenseQuery(productsQueryOptions({ page: 1, limit: 1000 }));

  const clientOptions =
    clientData?.items.map((client) => ({
      value: client.id,
      label: client.company ? `${client.company} - ${client.name}` : client.name
    })) ?? [];

  const serviceOptions =
    (productData?.products ?? [])
      .filter((product) => product.type === 'service')
      .map((product) => ({
        value: product.id,
        label: `${product.name} - ${product.categoryName}`
      })) ?? [];

  const createMutation = useMutation({
    ...createQuotationMutation,
    onSuccess: () => {
      toast.success('Quotation created successfully');
      router.push('/dashboard/quotations');
    },
    onError: () => toast.error('Failed to create quotation')
  });

  const updateMutation = useMutation({
    ...updateQuotationMutation,
    onSuccess: () => {
      toast.success('Quotation updated successfully');
      router.push('/dashboard/quotations');
    },
    onError: () => toast.error('Failed to update quotation')
  });

  const form = useAppForm({
    defaultValues: {
      number: initialData?.number ?? '',
      clientId: initialData?.clientId ?? Number(clientOptions[0]?.value ?? 0),
      serviceIds: initialData?.serviceIds ?? [],
      status: initialData?.status ?? 'DRAFT',
      total: initialData?.total ?? 0,
      validUntil: toDateInputValue(initialData?.validUntil),
      notes: initialData?.notes ?? '',
      itemsCount: initialData?.itemsCount ?? Math.max(initialData?.serviceIds.length ?? 0, 1)
    } as QuotationFormValues,
    validators: { onSubmit: quotationSchema },
    onSubmit: async ({ value }) => {
      const payload = {
        ...value,
        validUntil: value.validUntil || null,
        notes: value.notes || null
      };

      if (isEdit) {
        await updateMutation.mutateAsync({ id: initialData.id, values: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
    }
  });

  const { FormTextField, FormSelectField, FormTextareaField } =
    useFormFields<QuotationFormValues>();

  return (
    <Card className='mx-auto w-full'>
      <CardHeader>
        <CardTitle className='text-2xl font-bold'>{pageTitle}</CardTitle>
      </CardHeader>
      <CardContent>
        <form.AppForm>
          <form.Form className='space-y-6'>
            <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
              <FormTextField name='number' label='Quotation Number' required />
              <FormSelectField name='clientId' label='Client' required options={clientOptions} />
            </div>

            <form.AppField
              name='serviceIds'
              mode='array'
              children={(field) => {
                const selectedServiceIds = field.state.value || [];

                return (
                  <field.FieldSet>
                    <field.Field>
                      <field.FieldLabel>Services</field.FieldLabel>
                      <field.FieldDescription>
                        Link one or more services from your catalog to this quotation.
                      </field.FieldDescription>
                      <div className='grid gap-3 rounded-lg border p-4 md:grid-cols-2'>
                        {serviceOptions.map((option) => {
                          const checked = selectedServiceIds.includes(option.value);

                          return (
                            <field.Field key={option.value} orientation='horizontal'>
                              <Checkbox
                                checked={checked}
                                onCheckedChange={(nextChecked) => {
                                  field.handleChange(
                                    nextChecked
                                      ? [...selectedServiceIds, option.value]
                                      : selectedServiceIds.filter((id) => id !== option.value)
                                  );
                                }}
                              />
                              <field.FieldContent>
                                <field.FieldLabel className='leading-none'>
                                  {option.label}
                                </field.FieldLabel>
                              </field.FieldContent>
                            </field.Field>
                          );
                        })}
                      </div>
                      <field.FieldError />
                    </field.Field>
                  </field.FieldSet>
                );
              }}
            />

            <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
              <FormSelectField
                name='status'
                label='Status'
                required
                options={QUOTATION_STATUS_OPTIONS}
              />
              <FormTextField name='total' label='Total Amount' required type='number' />
              <FormTextField name='itemsCount' label='Line Items' required type='number' />
            </div>

            <FormTextField name='validUntil' label='Valid Until' type='date' />
            <FormTextareaField
              name='notes'
              label='Notes'
              rows={5}
              placeholder='Scope notes, commercial terms, or exclusions.'
            />

            <div className='flex justify-end gap-2'>
              <Button type='button' variant='outline' onClick={() => router.back()}>
                Back
              </Button>
              <form.SubmitButton>
                {isEdit ? 'Update Quotation' : 'Create Quotation'}
              </form.SubmitButton>
            </div>
          </form.Form>
        </form.AppForm>
      </CardContent>
    </Card>
  );
}
