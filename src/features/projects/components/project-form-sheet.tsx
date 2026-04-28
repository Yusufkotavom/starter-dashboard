'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { useAppForm, useFormFields } from '@/components/ui/tanstack-form';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';
import { toast } from 'sonner';
import { createProjectMutation, updateProjectMutation } from '../api/mutations';
import { projectKeys } from '../api/queries';
import type { Project } from '../api/types';
import { clientsQueryOptions } from '@/features/clients/api/queries';
import { quotationsQueryOptions } from '@/features/quotations/api/queries';
import { PROJECT_STATUS_OPTIONS } from '../constants';
import { projectSchema, type ProjectFormValues } from '../schemas/project';
import { getQueryClient } from '@/lib/query-client';

interface ProjectFormSheetProps {
  project?: Project;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function toDateInputValue(value: string | null | undefined): string {
  return value ? value.slice(0, 10) : '';
}

function normalizeOptionalNumber(value: number | string | null | undefined): number | null {
  return typeof value === 'number' ? value : null;
}

export function ProjectFormSheet({ project, open, onOpenChange }: ProjectFormSheetProps) {
  const isEdit = !!project;
  const { data: clientData } = useQuery(clientsQueryOptions({ page: 1, limit: 1000 }));
  const { data: quotationData } = useQuery(quotationsQueryOptions({ page: 1, limit: 1000 }));
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
      onOpenChange(false);
      form.reset();
    },
    onError: () => {
      toast.error('Failed to create project');
    }
  });

  const updateMutation = useMutation({
    ...updateProjectMutation,
    onSuccess: () => {
      getQueryClient().invalidateQueries({ queryKey: projectKeys.all });
      toast.success('Project updated successfully');
      onOpenChange(false);
    },
    onError: () => {
      toast.error('Failed to update project');
    }
  });

  const form = useAppForm({
    defaultValues: {
      name: project?.name ?? '',
      clientId: project?.clientId ?? Number(clientOptions[0]?.value ?? 0),
      quotationId: project?.quotationId ?? null,
      status: project?.status ?? 'ACTIVE',
      startDate: toDateInputValue(project?.startDate),
      endDate: toDateInputValue(project?.endDate),
      budget: project?.budget ?? null,
      notes: project?.notes ?? ''
    } as ProjectFormValues,
    validators: {
      onSubmit: projectSchema
    },
    onSubmit: async ({ value }) => {
      const payload = {
        ...value,
        quotationId: value.quotationId === 0 ? null : normalizeOptionalNumber(value.quotationId),
        budget: normalizeOptionalNumber(value.budget),
        startDate: value.startDate || null,
        endDate: value.endDate || null,
        notes: value.notes || null
      };

      if (isEdit) {
        await updateMutation.mutateAsync({ id: project.id, values: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
    }
  });

  const { FormTextField, FormSelectField, FormTextareaField } = useFormFields<ProjectFormValues>();
  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='flex flex-col sm:max-w-xl'>
        <SheetHeader>
          <SheetTitle>{isEdit ? 'Edit Project' : 'New Project'}</SheetTitle>
          <SheetDescription>
            {isEdit
              ? 'Update delivery details, budget, and status for this project.'
              : 'Create a new project linked to an existing client.'}
          </SheetDescription>
        </SheetHeader>

        <div className='flex-1 overflow-auto pe-4'>
          <form.AppForm>
            <form.Form id='project-form-sheet' className='space-y-4 py-4'>
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

              <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                <FormSelectField
                  name='status'
                  label='Status'
                  required
                  options={PROJECT_STATUS_OPTIONS}
                  placeholder='Select status'
                />

                <FormTextField name='budget' label='Budget' type='number' placeholder='15000000' />
              </div>

              <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                <FormTextField name='startDate' label='Start Date' type='date' />
                <FormTextField name='endDate' label='End Date' type='date' />
              </div>

              <FormSelectField
                name='quotationId'
                label='Quotation'
                required
                options={quotationOptions}
              />

              <FormTextareaField
                name='notes'
                label='Internal Notes'
                placeholder='Kickoff notes, scope reminders, or dependencies.'
                rows={4}
              />
            </form.Form>
          </form.AppForm>
        </div>

        <SheetFooter className='mt-4'>
          <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type='submit' form='project-form-sheet' isLoading={isPending}>
            <Icons.check className='mr-2 h-4 w-4' />
            {isEdit ? 'Update Project' : 'Create Project'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export function ProjectFormSheetTrigger() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Icons.add className='mr-2 h-4 w-4' />
        New Project
      </Button>
      <ProjectFormSheet open={open} onOpenChange={setOpen} />
    </>
  );
}
