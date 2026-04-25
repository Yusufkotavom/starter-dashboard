'use client';

import Image from 'next/image';
import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppForm, useFormFields } from '@/components/ui/tanstack-form';
import { cn } from '@/lib/utils';
import { connectWhatsAppSessionMutation, updateSettingsMutation } from '../api/mutations';
import { settingsQueryOptions, whatsappSetupStatusQueryOptions } from '../api/queries';

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
  whatsappProvider: 'EMULATOR' | 'BRIDGE';
  whatsappBridgeUrl: string;
  whatsappApiKey: string;
  whatsappSessionName: string;
  whatsappCountryCode: string;
};

const whatsappProviderOptions = [
  { value: 'EMULATOR', label: 'Emulator' },
  { value: 'BRIDGE', label: 'Bridge' }
] as const;

export default function SettingsForm() {
  const { data } = useSuspenseQuery(settingsQueryOptions());
  const { data: whatsappStatus, refetch: refetchWhatsAppStatus } = useSuspenseQuery(
    whatsappSetupStatusQueryOptions()
  );
  const mutation = useMutation({
    ...updateSettingsMutation,
    onSuccess: () => {
      toast.success('Company setup saved');
    },
    onError: () => {
      toast.error('Failed to save company setup');
    }
  });
  const connectMutation = useMutation({
    ...connectWhatsAppSessionMutation,
    onSuccess: (result) => {
      toast.success(result.message);
    },
    onError: () => {
      toast.error('Failed to prepare WhatsApp session');
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
      paymentQrisUrl: data.paymentQrisUrl ?? '',
      whatsappProvider: data.whatsappProvider,
      whatsappBridgeUrl: data.whatsappBridgeUrl ?? '',
      whatsappApiKey: data.whatsappApiKey ?? '',
      whatsappSessionName: data.whatsappSessionName ?? '',
      whatsappCountryCode: data.whatsappCountryCode
    } as SettingsFormValues,
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync({
        ...value,
        paymentBankName: value.paymentBankName || null,
        paymentAccountName: value.paymentAccountName || null,
        paymentAccountNumber: value.paymentAccountNumber || null,
        paymentQrisUrl: value.paymentQrisUrl || null,
        whatsappBridgeUrl: value.whatsappBridgeUrl || null,
        whatsappApiKey: value.whatsappApiKey || null,
        whatsappSessionName: value.whatsappSessionName || null
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

            <div className='space-y-4'>
              <div>
                <h3 className='text-sm font-medium'>WhatsApp Channel</h3>
                <p className='text-muted-foreground text-sm'>
                  Configure how the dashboard talks to WAHA. For WAHA Core on this server, use
                  session name <code>default</code>. If the dashboard is on Vercel, use your public
                  tunnel URL instead of <code>127.0.0.1</code>.
                </p>
                <p className='text-muted-foreground mt-2 text-xs'>
                  Local WAHA example: URL <code>http://127.0.0.1:3006</code>, API key{' '}
                  <code>local-waha-key</code>, session <code>default</code>.
                </p>
              </div>

              <div className='grid gap-4 md:grid-cols-2'>
                <FormSelectField
                  name='whatsappProvider'
                  label='WhatsApp Provider'
                  required
                  options={whatsappProviderOptions}
                />
                <FormTextField
                  name='whatsappCountryCode'
                  label='Default Country Code'
                  required
                  placeholder='62'
                />
                <FormTextField
                  name='whatsappBridgeUrl'
                  label='WA API URL'
                  placeholder='https://your-waha.example.com'
                />
                <FormTextField
                  name='whatsappApiKey'
                  label='WA API Key'
                  placeholder='local-waha-key'
                />
                <FormTextField
                  name='whatsappSessionName'
                  label='Session Name'
                  placeholder='default'
                />
              </div>

              <div className='rounded-lg border p-4'>
                <div className='flex flex-col gap-3 md:flex-row md:items-start md:justify-between'>
                  <div className='space-y-1'>
                    <div className='flex flex-wrap items-center gap-2'>
                      <span className='text-sm font-medium'>WAHA Status</span>
                      <span
                        className={cn(
                          'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
                          whatsappStatus.reachable
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                        )}
                      >
                        {whatsappStatus.sessionStatus ||
                          (whatsappStatus.reachable ? 'REACHABLE' : 'NOT READY')}
                      </span>
                    </div>
                    <p className='text-muted-foreground text-sm'>{whatsappStatus.message}</p>
                    <div className='text-muted-foreground space-y-1 text-xs'>
                      <p>Saved URL: {whatsappStatus.bridgeUrl || '-'}</p>
                      <p>Saved session: {whatsappStatus.sessionName || '-'}</p>
                      <p>API key: {whatsappStatus.apiKeyConfigured ? 'configured' : 'missing'}</p>
                      <p>Engine: {whatsappStatus.engine || '-'}</p>
                    </div>
                  </div>

                  <div className='flex flex-wrap gap-2'>
                    <Button
                      type='button'
                      variant='outline'
                      onClick={() => void refetchWhatsAppStatus()}
                      isLoading={false}
                    >
                      Refresh Status
                    </Button>
                    <Button
                      type='button'
                      variant='outline'
                      onClick={() => void connectMutation.mutateAsync()}
                      isLoading={connectMutation.isPending}
                    >
                      Prepare Session
                    </Button>
                    {whatsappStatus.screenshotUrl ? (
                      <Button type='button' variant='outline' asChild>
                        <a
                          href={`${whatsappStatus.screenshotUrl}?t=${Date.now()}`}
                          target='_blank'
                          rel='noreferrer'
                        >
                          Open QR
                        </a>
                      </Button>
                    ) : null}
                  </div>
                </div>

                {whatsappStatus.screenshotUrl ? (
                  <div className='mt-4 space-y-2'>
                    <p className='text-muted-foreground text-xs'>
                      QR preview. Refresh status after scanning if it still shows QR mode.
                    </p>
                    <Image
                      key={whatsappStatus.sessionStatus || 'whatsapp-qr'}
                      src={`${whatsappStatus.screenshotUrl}?t=${Date.now()}`}
                      alt='WhatsApp QR'
                      width={320}
                      height={320}
                      unoptimized
                      className='max-h-80 rounded-md border object-contain'
                    />
                  </div>
                ) : null}
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
