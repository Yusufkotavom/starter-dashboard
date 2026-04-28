'use client';

import Image from 'next/image';
import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  companyLogoUrl: string;
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

async function uploadCompanyLogo(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/uploads/company-logo', {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    throw new Error('Failed to upload company logo');
  }

  const payload = (await response.json()) as { url: string };
  return payload.url;
}

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
      companyLogoUrl: data.companyLogoUrl ?? '',
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
        companyLogoUrl: value.companyLogoUrl || null,
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
  const currentLogo = form.getFieldValue('companyLogoUrl');

  return (
    <Card className='mx-auto max-w-5xl'>
      <CardHeader>
        <CardTitle>Company Setup</CardTitle>
        <CardDescription>
          Settings are grouped by tab for faster setup and cleaner maintenance.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form.AppForm>
          <form.Form className='space-y-6'>
            <Tabs defaultValue='branding' className='space-y-4'>
              <TabsList className='h-auto w-full justify-start gap-1 overflow-x-auto p-1'>
                <TabsTrigger value='branding'>Branding</TabsTrigger>
                <TabsTrigger value='billing'>Billing</TabsTrigger>
                <TabsTrigger value='payments'>Payments</TabsTrigger>
                <TabsTrigger value='whatsapp'>WhatsApp</TabsTrigger>
              </TabsList>

              <TabsContent value='branding'>
                <Card>
                  <CardHeader>
                    <CardTitle className='text-base'>Brand Identity</CardTitle>
                    <CardDescription>
                      This logo and company info are used across dashboard and documents.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    <div className='grid gap-4 md:grid-cols-[120px_1fr]'>
                      <div className='flex h-[120px] w-[120px] items-center justify-center rounded-lg border bg-muted/20'>
                        {currentLogo ? (
                          <Image
                            src={currentLogo}
                            alt='Company logo'
                            width={96}
                            height={96}
                            className='h-20 w-20 object-contain'
                          />
                        ) : (
                          <span className='text-muted-foreground text-xs'>No logo</span>
                        )}
                      </div>
                      <div className='space-y-3'>
                        <FormTextField
                          name='companyLogoUrl'
                          label='Company Logo URL'
                          placeholder='https://...'
                        />
                        <div>
                          <Button
                            type='button'
                            variant='outline'
                            onClick={() => {
                              const input = document.createElement('input');
                              input.type = 'file';
                              input.accept = 'image/png,image/jpeg,image/webp,image/svg+xml';
                              input.addEventListener('change', async () => {
                                const file = input.files?.[0];
                                if (!file) return;

                                try {
                                  const url = await uploadCompanyLogo(file);
                                  form.setFieldValue('companyLogoUrl', url);
                                  toast.success('Logo uploaded');
                                } catch {
                                  toast.error('Failed to upload logo');
                                }
                              });
                              input.click();
                            }}
                          >
                            Upload Logo
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className='grid gap-4 md:grid-cols-2'>
                      <FormTextField name='companyName' label='Company Name' required />
                      <FormTextField
                        name='companyEmail'
                        label='Finance Email'
                        required
                        type='email'
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value='billing'>
                <Card>
                  <CardHeader>
                    <CardTitle className='text-base'>Billing Defaults</CardTitle>
                    <CardDescription>
                      Numbering, currency, and invoicing defaults for quotation and invoice.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className='space-y-4'>
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
                      <FormTextField
                        name='taxRate'
                        label='Default Tax Rate (%)'
                        required
                        type='number'
                      />
                      <FormSwitchField
                        name='requiresApproval'
                        label='Require approval before project kickoff'
                        description='When enabled, approved quotation becomes the expected handoff gate.'
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value='payments'>
                <Card>
                  <CardHeader>
                    <CardTitle className='text-base'>Payment Instructions</CardTitle>
                    <CardDescription>
                      These bank details appear in invoice document and portal billing pages.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className='grid gap-4 md:grid-cols-2'>
                    <FormTextField name='paymentBankName' label='Bank Name' />
                    <FormTextField name='paymentAccountName' label='Account Name' />
                    <FormTextField name='paymentAccountNumber' label='Account Number' />
                    <FormTextField name='paymentQrisUrl' label='Mock QRIS URL' />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value='whatsapp'>
                <Card>
                  <CardHeader>
                    <CardTitle className='text-base'>WhatsApp Channel</CardTitle>
                    <CardDescription>
                      Configure WAHA/Bridge connection for outbound and inbound message workflows.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className='space-y-4'>
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
                            <p>
                              API key: {whatsappStatus.apiKeyConfigured ? 'configured' : 'missing'}
                            </p>
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
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <div className='flex justify-end'>
              <form.SubmitButton>Save Settings</form.SubmitButton>
            </div>
          </form.Form>
        </form.AppForm>
      </CardContent>
    </Card>
  );
}
