'use client';

import { useAppForm, useFormFields } from '@/components/ui/tanstack-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createCategoryMutation, updateCategoryMutation } from '../api/mutations';
import type { Category } from '../api/types';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import * as z from 'zod';
import { categorySchema, type CategoryFormValues } from '@/features/categories/schemas/category';

export default function CategoryForm({
  initialData,
  pageTitle
}: {
  initialData: Category | null;
  pageTitle: string;
}) {
  const router = useRouter();
  const isEdit = !!initialData;

  const createMutation = useMutation({
    ...createCategoryMutation,
    onSuccess: () => {
      toast.success('Category created successfully');
      router.push('/dashboard/categories');
    },
    onError: () => {
      toast.error('Failed to create category');
    }
  });

  const updateMutation = useMutation({
    ...updateCategoryMutation,
    onSuccess: () => {
      toast.success('Category updated successfully');
      router.push('/dashboard/categories');
    },
    onError: () => {
      toast.error('Failed to update category');
    }
  });

  const form = useAppForm({
    defaultValues: {
      name: initialData?.name ?? '',
      slug: initialData?.slug ?? '',
      description: initialData?.description ?? ''
    } as CategoryFormValues,
    validators: {
      onSubmit: categorySchema
    },
    onSubmit: ({ value }) => {
      const payload = {
        name: value.name,
        slug: value.slug,
        description: value.description
      };

      if (isEdit) {
        updateMutation.mutate({ id: initialData.id, values: payload });
      } else {
        createMutation.mutate(payload);
      }
    }
  });

  const { FormTextField, FormTextareaField } = useFormFields<CategoryFormValues>();

  return (
    <Card className='mx-auto w-full'>
      <CardHeader>
        <CardTitle className='text-left text-2xl font-bold'>{pageTitle}</CardTitle>
      </CardHeader>
      <CardContent>
        <form.AppForm>
          <form.Form className='space-y-8'>
            <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
              <FormTextField
                name='name'
                label='Category Name'
                required
                placeholder='Enter category name'
                validators={{
                  onBlur: z.string().min(2, 'Category name must be at least 2 characters.')
                }}
              />

              <FormTextField
                name='slug'
                label='Slug'
                required
                placeholder='example-category'
                validators={{
                  onBlur: z
                    .string()
                    .min(2, 'Slug must be at least 2 characters.')
                    .regex(/^[a-z0-9-]+$/, 'Use lowercase letters, numbers, and hyphens only.')
                }}
              />
            </div>

            <FormTextareaField
              name='description'
              label='Description'
              placeholder='Optional short description for this category'
              maxLength={500}
              rows={4}
              validators={{
                onBlur: z.string().max(500, 'Description must be 500 characters or less.')
              }}
            />

            <div className='flex justify-end gap-2'>
              <Button type='button' variant='outline' onClick={() => router.back()}>
                Back
              </Button>
              <form.SubmitButton>{isEdit ? 'Update Category' : 'Add Category'}</form.SubmitButton>
            </div>
          </form.Form>
        </form.AppForm>
      </CardContent>
    </Card>
  );
}
