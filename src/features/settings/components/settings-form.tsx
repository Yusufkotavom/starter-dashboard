'use client';

import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppForm, useFormFields } from '@/components/ui/tanstack-form';

const currencyOptions = [
  { value: 'IDR', label: 'IDR' },
  { value: 'USD', label: 'USD' }
] as const;

const paymentTermOptions = [
  { value: '7', label: '7 days' },
  { value: '14', label: '14 days' },
  { value: '30', label: '30 days' }
] as const;

type SettingsFormValues = {
  companyName: string;
  companyEmail: string;
  defaultCurrency: string;
  invoicePrefix: string;
  quotationPrefix: string;
  paymentTerms: string;
  taxRate: number;
  requiresApproval: boolean;
};

export default function SettingsForm() {
  const form = useAppForm({
    defaultValues: {
      companyName: 'Open Agency Studio',
      companyEmail: 'finance@openagency.test',
      defaultCurrency: 'IDR',
      invoicePrefix: 'INV',
      quotationPrefix: 'QUO',
      paymentTerms: '14',
      taxRate: 11,
      requiresApproval: true
    } as SettingsFormValues,
    onSubmit: async () => {
      toast.success('Agency settings saved for this demo session');
    }
  });

  const { FormTextField, FormSelectField, FormSwitchField } = useFormFields<SettingsFormValues>();

  return (
    <Card className='mx-auto max-w-4xl'>
      <CardHeader>
        <CardTitle>Agency Settings</CardTitle>
        <CardDescription>
          These settings define operational defaults for quotations and invoices.
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
                name='paymentTerms'
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

            <div className='flex justify-end'>
              <form.SubmitButton>Save Settings</form.SubmitButton>
            </div>
          </form.Form>
        </form.AppForm>
      </CardContent>
    </Card>
  );
}
