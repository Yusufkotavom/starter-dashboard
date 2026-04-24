'use client';

import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppForm, useFormFields } from '@/components/ui/tanstack-form';
import { settingsQueryOptions } from '../api/queries';
import { updateSettingsMutation } from '../api/mutations';

const currencyOptions = [
  { value: 'IDR', label: 'IDR' },
  { value: 'USD', label: 'USD' }
] as const;

const paymentTermOptions = [
  { value: 7, label: '7 days' },
  { value: 14, label: '14 days' },
  { value: 30, label: '30 days' }
] as const;

type SettingsFormValues = {
  companyName: string;
  companyEmail: string;
  defaultCurrency: string;
  invoicePrefix: string;
  quotationPrefix: string;
  paymentTermsDays: number;
  taxRate: number;
  requiresApproval: boolean;
  paymentBankName: string;
  paymentAccountName: string;
  paymentAccountNumber: string;
  paymentQrisUrl: string;
};

export default function SettingsForm() {
  const { data } = useSuspenseQuery(settingsQueryOptions());
  const mutation = useMutation({
    ...updateSettingsMutation,
    onSuccess: () => {
      toast.success('Company setup saved');
    },
    onError: () => {
      toast.error('Failed to save company setup');
    }
  });

  const form = useAppForm({
    defaultValues: {
      companyName: data.companyName,
      companyEmail: data.companyEmail,
      defaultCurrency: data.defaultCurrency,
      invoicePrefix: data.invoicePrefix,
      quotationPrefix: data.quotationPrefix,
      paymentTermsDays: data.paymentTermsDays,
      taxRate: data.taxRate,
      requiresApproval: data.requiresApproval,
      paymentBankName: data.paymentBankName ?? '',
      paymentAccountName: data.paymentAccountName ?? '',
      paymentAccountNumber: data.paymentAccountNumber ?? '',
      paymentQrisUrl: data.paymentQrisUrl ?? ''
    } as SettingsFormValues,
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync({
        ...value,
        paymentBankName: value.paymentBankName || null,
        paymentAccountName: value.paymentAccountName || null,
        paymentAccountNumber: value.paymentAccountNumber || null,
        paymentQrisUrl: value.paymentQrisUrl || null
      });
    }
  });

  const { FormTextField, FormSelectField, FormSwitchField } = useFormFields<SettingsFormValues>();

  return (
    <Card className='mx-auto max-w-4xl'>
      <CardHeader>
        <CardTitle>Company Setup</CardTitle>
        <CardDescription>
          Configure company identity, numbering rules, and internal payment instructions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form.AppForm>
          <form.Form className='space-y-6'>
            <div className='grid gap-4 md:grid-cols-2'>
              <FormTextField name='companyName' label='Company Name' required />
              <FormTextField name='companyEmail' label='Finance Email' required type='email' />
            </div>

            <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
              <FormSelectField
                name='defaultCurrency'
                label='Default Currency'
                required
                options={currencyOptions}
              />
              <FormTextField name='invoicePrefix' label='Invoice Prefix' required />
              <FormTextField name='quotationPrefix' label='Quotation Prefix' required />
              <FormSelectField
                name='paymentTermsDays'
                label='Payment Terms'
                required
                options={paymentTermOptions}
              />
            </div>

            <div className='grid gap-4 md:grid-cols-2'>
              <FormTextField name='taxRate' label='Default Tax Rate (%)' required type='number' />
              <FormSwitchField
                name='requiresApproval'
                label='Require approval before project kickoff'
                description='When enabled, approved quotation becomes the expected handoff gate.'
              />
            </div>

            <div className='space-y-4'>
              <div>
                <h3 className='text-sm font-medium'>Internal Payment</h3>
                <p className='text-muted-foreground text-sm'>
                  Portal payment page will show these bank transfer and mock QRIS instructions.
                </p>
              </div>

              <div className='grid gap-4 md:grid-cols-2'>
                <FormTextField name='paymentBankName' label='Bank Name' />
                <FormTextField name='paymentAccountName' label='Account Name' />
                <FormTextField name='paymentAccountNumber' label='Account Number' />
                <FormTextField name='paymentQrisUrl' label='Mock QRIS URL' />
              </div>
            </div>

            <div className='flex justify-end'>
              <form.SubmitButton>Save Settings</form.SubmitButton>
            </div>
          </form.Form>
        </form.AppForm>
      </CardContent>
    </Card>
  );
}
