'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
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
import { createExpenseMutation, updateExpenseMutation } from '../api/mutations';
import { expenseKeys } from '../api/queries';
import type { Expense } from '../api/types';
import { projectsQueryOptions } from '@/features/projects/api/queries';
import { EXPENSE_CATEGORY_OPTIONS } from '../constants';
import { expenseSchema, type ExpenseFormValues } from '../schemas/expense';
import { getQueryClient } from '@/lib/query-client';

interface ExpenseFormSheetProps {
  expense?: Expense;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function toDateInputValue(value: string | null | undefined): string {
  return value ? value.slice(0, 10) : '';
}

export function ExpenseFormSheet({ expense, open, onOpenChange }: ExpenseFormSheetProps) {
  const isEdit = !!expense;
  const { data: projectData } = useQuery(projectsQueryOptions({ page: 1, limit: 1000 }));
  const projectOptions = [
    { value: 0, label: 'Unassigned expense' },
    ...(projectData?.items.map((project) => ({
      value: project.id,
      label: project.name
    })) ?? [])
  ];

  const createMutation = useMutation({
    ...createExpenseMutation,
    onSuccess: () => {
      getQueryClient().invalidateQueries({ queryKey: expenseKeys.all });
      toast.success('Expense recorded successfully');
      onOpenChange(false);
      form.reset();
    },
    onError: () => toast.error('Failed to create expense')
  });

  const updateMutation = useMutation({
    ...updateExpenseMutation,
    onSuccess: () => {
      getQueryClient().invalidateQueries({ queryKey: expenseKeys.all });
      toast.success('Expense updated successfully');
      onOpenChange(false);
    },
    onError: () => toast.error('Failed to update expense')
  });

  const form = useAppForm({
    defaultValues: {
      projectId: expense?.projectId ?? 0,
      category: expense?.category ?? 'Vendor',
      vendor: expense?.vendor ?? '',
      amount: expense?.amount ?? 0,
      date: toDateInputValue(expense?.date),
      notes: expense?.notes ?? ''
    } as ExpenseFormValues,
    validators: {
      onSubmit: expenseSchema
    },
    onSubmit: async ({ value }) => {
      const payload = {
        ...value,
        projectId: value.projectId === 0 ? null : value.projectId,
        vendor: value.vendor || null,
        notes: value.notes || null
      };

      if (isEdit) {
        await updateMutation.mutateAsync({ id: expense.id, values: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
    }
  });

  const { FormTextField, FormSelectField, FormTextareaField } = useFormFields<ExpenseFormValues>();
  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='flex flex-col sm:max-w-xl'>
        <SheetHeader>
          <SheetTitle>{isEdit ? 'Edit Expense' : 'Record Expense'}</SheetTitle>
          <SheetDescription>Track delivery cost and operational spend.</SheetDescription>
        </SheetHeader>

        <div className='flex-1 overflow-auto pe-4'>
          <form.AppForm>
            <form.Form id='expense-form-sheet' className='space-y-4 py-4'>
              <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                <FormSelectField
                  name='projectId'
                  label='Project'
                  required
                  options={projectOptions}
                />
                <FormSelectField
                  name='category'
                  label='Category'
                  required
                  options={EXPENSE_CATEGORY_OPTIONS}
                />
              </div>

              <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
                <FormTextField name='vendor' label='Vendor' />
                <FormTextField name='amount' label='Amount' required type='number' />
                <FormTextField name='date' label='Date' required type='date' />
              </div>

              <FormTextareaField name='notes' label='Notes' rows={4} />
            </form.Form>
          </form.AppForm>
        </div>

        <SheetFooter className='mt-4'>
          <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type='submit' form='expense-form-sheet' isLoading={isPending}>
            <Icons.check className='mr-2 h-4 w-4' />
            {isEdit ? 'Update Expense' : 'Save Expense'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export function ExpenseFormSheetTrigger() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Icons.add className='mr-2 h-4 w-4' />
        Record Expense
      </Button>
      <ExpenseFormSheet open={open} onOpenChange={setOpen} />
    </>
  );
}
