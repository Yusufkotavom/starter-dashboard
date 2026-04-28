'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { useStore } from '@tanstack/react-form';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useAppForm, useFormFields } from '@/components/ui/tanstack-form';
import { clientsQueryOptions } from '@/features/clients/api/queries';
import { quotationsQueryOptions } from '@/features/quotations/api/queries';
import { buildProjectBoardHref, getProjectProgressSummary } from '@/lib/project-progress';
import { formatPrice } from '@/lib/utils';
import { createProjectMutation, updateProjectMutation } from '../api/mutations';
import { projectKeys } from '../api/queries';
import type { Project } from '../api/types';
import { PROJECT_MODE_OPTIONS, PROJECT_STATUS_OPTIONS } from '../constants';
import { projectSchema, type ProjectFormValues } from '../schemas/project';
import { getQueryClient } from '@/lib/query-client';

function toDateInputValue(value: string | null | undefined): string {
  return value ? value.slice(0, 10) : '';
}

function normalizeOptionalNumber(value: number | string | null | undefined): number | null {
  return typeof value === 'number' ? value : null;
}

export default function ProjectForm({
  initialData,
  pageTitle
}: {
  initialData: Project | null;
  pageTitle: string;
}) {
  const router = useRouter();
  const isEdit = !!initialData;
  const { data: clientData } = useSuspenseQuery(clientsQueryOptions({ page: 1, limit: 1000 }));
  const { data: quotationData } = useSuspenseQuery(
    quotationsQueryOptions({ page: 1, limit: 1000 })
  );

  const clientOptions =
    clientData?.items.map((client) => ({
      value: client.id,
      label: client.company ? `${client.company} - ${client.name}` : client.name
    })) ?? [];
  const quotationOptions = [
    { value: 0, label: 'No quotation linked' },
    ...(quotationData?.items.map((quotation) => ({
      value: quotation.id,
      label: `${quotation.number} - ${quotation.clientCompany ?? quotation.clientName}`
    })) ?? [])
  ];

  const createMutation = useMutation({
    ...createProjectMutation,
    onSuccess: () => {
      getQueryClient().invalidateQueries({ queryKey: projectKeys.all });
      toast.success('Project created successfully');
      router.push('/dashboard/projects');
    },
    onError: () => toast.error('Failed to create project')
  });

  const updateMutation = useMutation({
    ...updateProjectMutation,
    onSuccess: () => {
      getQueryClient().invalidateQueries({ queryKey: projectKeys.all });
      toast.success('Project updated successfully');
      router.push('/dashboard/projects');
    },
    onError: () => toast.error('Failed to update project')
  });

  const form = useAppForm({
    defaultValues: {
      name: initialData?.name ?? '',
      clientId: initialData?.clientId ?? Number(clientOptions[0]?.value ?? 0),
      quotationId: initialData?.quotationId ?? null,
      status: initialData?.status ?? 'ACTIVE',
      mode: initialData?.mode ?? 'CLIENT_DELIVERY',
      agentStack: initialData?.agentStack ?? '',
      playbookRefs: initialData?.playbookRefs ?? 'masterplan.md\nagent.md\nREADME.md',
      startDate: toDateInputValue(initialData?.startDate),
      endDate: toDateInputValue(initialData?.endDate),
      budget: initialData?.budget ?? null,
      notes: initialData?.notes ?? ''
    } as ProjectFormValues,
    validators: {
      onSubmit: projectSchema
    },
    onSubmit: async ({ value }) => {
      const payload = {
        ...value,
        quotationId: value.quotationId === 0 ? null : normalizeOptionalNumber(value.quotationId),
        budget: normalizeOptionalNumber(value.budget),
        agentStack: value.agentStack || null,
        playbookRefs: value.playbookRefs || null,
        startDate: value.startDate || null,
        endDate: value.endDate || null,
        notes: value.notes || null
      };

      if (isEdit) {
        await updateMutation.mutateAsync({ id: initialData.id, values: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
    }
  });

  const quotationId = useStore(form.store, (state) => state.values.quotationId);
  const budget = useStore(form.store, (state) => state.values.budget);
  const selectedQuotation =
    quotationData?.items.find((quotation) => quotation.id === quotationId) ?? null;
  const projectSummary = initialData ? getProjectProgressSummary(initialData) : null;
  const boardHref = initialData
    ? buildProjectBoardHref({
        id: initialData.id,
        name: initialData.name,
        clientName: initialData.clientCompany ?? initialData.clientName,
        status: initialData.status,
        startDate: initialData.startDate,
        endDate: initialData.endDate,
        quotationId: initialData.quotationId,
        budget: initialData.budget
      })
    : '/dashboard/kanban';

  useEffect(() => {
    if (!selectedQuotation) return;

    form.setFieldValue('clientId', selectedQuotation.clientId);

    if (
      !isEdit ||
      selectedQuotation.id !== initialData?.quotationId ||
      budget === null ||
      budget === undefined ||
      budget === 0
    ) {
      form.setFieldValue('budget', selectedQuotation.total);
    }
  }, [budget, form, initialData?.quotationId, isEdit, selectedQuotation]);

  const { FormTextField, FormSelectField, FormTextareaField } = useFormFields<ProjectFormValues>();

  return (
    <Card className='mx-auto w-full'>
      <CardHeader>
        <CardTitle className='text-2xl font-bold'>{pageTitle}</CardTitle>
      </CardHeader>
      <CardContent>
        {initialData && projectSummary ? (
          <div className='mb-6 grid gap-4 lg:grid-cols-3'>
            <div className='rounded-xl border bg-muted/20 p-4'>
              <div className='text-muted-foreground text-sm'>Delivery Progress</div>
              <div className='mt-2 flex items-end justify-between gap-3'>
                <div>
                  <div className='text-2xl font-semibold'>{projectSummary.progress}%</div>
                  <div className='text-muted-foreground text-sm'>{projectSummary.phase}</div>
                </div>
                <div className='text-muted-foreground text-right text-xs'>
                  <div>Status {initialData.status.toLowerCase()}</div>
                  <div>{projectSummary.nextStep}</div>
                </div>
              </div>
              <Progress value={projectSummary.progress} className='mt-4' />
            </div>

            <div className='rounded-xl border bg-muted/20 p-4'>
              <div className='text-muted-foreground text-sm'>Project Snapshot</div>
              <div className='mt-3 space-y-2 text-sm'>
                <div className='flex items-center justify-between gap-4'>
                  <span className='text-muted-foreground'>Client</span>
                  <span className='font-medium'>
                    {initialData.clientCompany ?? initialData.clientName}
                  </span>
                </div>
                <div className='flex items-center justify-between gap-4'>
                  <span className='text-muted-foreground'>Budget</span>
                  <span className='font-medium'>
                    {initialData.budget ? formatPrice(Number(initialData.budget)) : 'Not set'}
                  </span>
                </div>
                <div className='flex items-center justify-between gap-4'>
                  <span className='text-muted-foreground'>Quotation</span>
                  <span className='font-medium'>{initialData.quotationNumber ?? 'Not linked'}</span>
                </div>
              </div>
            </div>

            <div className='rounded-xl border bg-muted/20 p-4'>
              <div className='text-muted-foreground text-sm'>Workspace Actions</div>
              <div className='mt-3 flex flex-col gap-2'>
                <Button asChild>
                  <Link href={boardHref}>
                    <Icons.kanban className='mr-2 h-4 w-4' />
                    Open Board
                  </Link>
                </Button>
                <Button asChild variant='outline'>
                  <Link href='/dashboard/projects'>
                    <Icons.chevronLeft className='mr-2 h-4 w-4' />
                    Back to Projects
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        <form.AppForm>
          <form.Form className='space-y-6'>
            <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
              <FormTextField
                name='name'
                label='Project Name'
                required
                placeholder='Website revamp'
              />
              <FormSelectField
                name='clientId'
                label='Client'
                required
                options={clientOptions}
                placeholder='Select client'
              />
            </div>

            <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
              <FormSelectField
                name='quotationId'
                label='Quotation'
                required
                options={quotationOptions}
              />
              <FormSelectField
                name='status'
                label='Status'
                required
                options={PROJECT_STATUS_OPTIONS}
                placeholder='Select status'
              />
            </div>

            <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
              <FormSelectField
                name='mode'
                label='Project Mode'
                required
                options={PROJECT_MODE_OPTIONS}
                placeholder='Select mode'
              />
              <FormTextField
                name='agentStack'
                label='Agent Stack'
                placeholder='OpenClaw, Hermes, MCP set'
              />
            </div>

            {selectedQuotation ? (
              <div className='rounded-lg border bg-muted/30 p-4 text-sm'>
                <div className='font-medium'>Linked quotation</div>
                <div className='text-muted-foreground mt-1'>
                  {selectedQuotation.number} for{' '}
                  {selectedQuotation.clientCompany ?? selectedQuotation.clientName}
                </div>
                <div className='text-muted-foreground mt-1'>
                  Project budget defaults to quotation total of{' '}
                  {selectedQuotation.total.toLocaleString('id-ID')}.
                </div>
              </div>
            ) : null}

            <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
              <FormTextField name='budget' label='Budget' type='number' placeholder='15000000' />
              <FormTextField name='startDate' label='Start Date' type='date' />
              <FormTextField name='endDate' label='End Date' type='date' />
            </div>

            <FormTextareaField
              name='notes'
              label='Internal Notes'
              placeholder='Kickoff notes, scope reminders, or dependencies.'
              rows={4}
            />

            <FormTextareaField
              name='playbookRefs'
              label='Playbook Files'
              placeholder={'masterplan.md\nagent.md\nREADME.md'}
              rows={4}
            />

            <div className='flex justify-end gap-2'>
              <Button type='button' variant='outline' onClick={() => router.back()}>
                Back
              </Button>
              <form.SubmitButton>{isEdit ? 'Update Project' : 'Create Project'}</form.SubmitButton>
            </div>
          </form.Form>
        </form.AppForm>
      </CardContent>
    </Card>
  );
}
