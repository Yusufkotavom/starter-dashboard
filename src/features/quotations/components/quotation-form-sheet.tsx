'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useAppForm, useFormFields } from '@/components/ui/tanstack-form';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';
import { createQuotationMutation, updateQuotationMutation } from '../api/mutations';
import type { Quotation } from '../api/types';
import { clientsQueryOptions } from '@/features/clients/api/queries';
import { productsQueryOptions } from '@/features/products/api/queries';
import { QUOTATION_STATUS_OPTIONS } from '../constants';
import { quotationSchema, type QuotationFormValues } from '../schemas/quotation';

interface QuotationFormSheetProps {
  quotation?: Quotation;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function toDateInputValue(value: string | null | undefined): string {
  return value ? value.slice(0, 10) : '';
}

export function QuotationFormSheet({ quotation, open, onOpenChange }: QuotationFormSheetProps) {
  const isEdit = !!quotation;
  const { data: clientData } = useQuery(clientsQueryOptions({ page: 1, limit: 1000 }));
  const { data: productData } = useQuery(productsQueryOptions({ page: 1, limit: 1000 }));
  const clientOptions =
    clientData?.items.map((client) => ({
      value: client.id,
      label: client.company ? `${client.company} - ${client.name}` : client.name
    })) ?? [];
  const serviceOptions = [
    { value: 0, label: 'Generic quotation' },
    ...((productData?.products ?? [])
      .filter((product) => product.type === 'service')
      .map((product) => ({
        value: product.id,
        label: `${product.name} - ${product.categoryName}`
      })) ?? [])
  ];

  const createMutation = useMutation({
    ...createQuotationMutation,
    onSuccess: () => {
      toast.success('Quotation created successfully');
      onOpenChange(false);
      form.reset();
    },
    onError: () => toast.error('Failed to create quotation')
  });

  const updateMutation = useMutation({
    ...updateQuotationMutation,
    onSuccess: () => {
      toast.success('Quotation updated successfully');
      onOpenChange(false);
    },
    onError: () => toast.error('Failed to update quotation')
  });

  const form = useAppForm({
    defaultValues: {
      number: quotation?.number ?? '',
      clientId: quotation?.clientId ?? Number(clientOptions[0]?.value ?? 0),
      serviceIds: quotation?.serviceIds ?? [],
      status: quotation?.status ?? 'DRAFT',
      total: quotation?.total ?? 0,
      validUntil: toDateInputValue(quotation?.validUntil),
      notes: quotation?.notes ?? '',
      itemsCount: quotation?.itemsCount ?? 1
    } as QuotationFormValues,
    validators: {
      onSubmit: quotationSchema
    },
    onSubmit: async ({ value }) => {
      const payload = {
        ...value,
        validUntil: value.validUntil || null,
        notes: value.notes || null
      };

      if (isEdit) {
        await updateMutation.mutateAsync({ id: quotation.id, values: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
    }
  });

  const { FormTextField, FormSelectField, FormTextareaField } =
    useFormFields<QuotationFormValues>();
  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='flex flex-col sm:max-w-xl'>
        <SheetHeader>
          <SheetTitle>{isEdit ? 'Edit Quotation' : 'New Quotation'}</SheetTitle>
          <SheetDescription>
            Build proposal records that can later convert into active projects.
          </SheetDescription>
        </SheetHeader>

        <div className='flex-1 overflow-auto pe-4'>
          <form.AppForm>
            <form.Form id='quotation-form-sheet' className='space-y-4 py-4'>
              <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
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
                          {serviceOptions
                            .filter((option) => option.value !== 0)
                            .map((option) => {
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

              <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
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
                rows={4}
                placeholder='Scope notes, commercial terms, or exclusions.'
              />
            </form.Form>
          </form.AppForm>
        </div>

        <SheetFooter className='mt-4'>
          <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type='submit' form='quotation-form-sheet' isLoading={isPending}>
            <Icons.check className='mr-2 h-4 w-4' />
            {isEdit ? 'Update Quotation' : 'Create Quotation'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export function QuotationFormSheetTrigger() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Icons.add className='mr-2 h-4 w-4' />
        New Quotation
      </Button>
      <QuotationFormSheet open={open} onOpenChange={setOpen} />
    </>
  );
}
