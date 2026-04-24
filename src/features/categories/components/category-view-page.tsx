'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import type { Category } from '../api/types';
import { notFound } from 'next/navigation';
import CategoryForm from './category-form';
import { categoryByIdOptions } from '../api/queries';

interface CategoryViewPageProps {
  categoryId: string;
}

export default function CategoryViewPage({ categoryId }: CategoryViewPageProps) {
  if (categoryId === 'new') {
    return <CategoryForm initialData={null} pageTitle='Create Category' />;
  }

  return <EditCategoryView categoryId={Number(categoryId)} />;
}

function EditCategoryView({ categoryId }: { categoryId: number }) {
  const { data } = useSuspenseQuery(categoryByIdOptions(categoryId));

  if (!data?.success || !data?.category) {
    notFound();
  }

  return <CategoryForm initialData={data.category as Category} pageTitle='Edit Category' />;
}
