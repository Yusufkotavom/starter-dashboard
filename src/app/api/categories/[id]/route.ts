import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { mapCategoryRecord } from '@/lib/catalog';
import type { CategoryMutationPayload } from '@/features/categories/api/types';
import { Prisma } from '@prisma/client';

type Params = { params: Promise<{ id: string }> };

function normalizeCategoryPayload(body: CategoryMutationPayload): Prisma.CategoryUpdateInput {
  return {
    name: body.name.trim(),
    slug: body.slug.trim().toLowerCase(),
    description: body.description.trim() || null
  };
}

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const category = await prisma.category.findUnique({
    where: { id: Number(id) },
    include: { _count: { select: { products: true } } }
  });

  if (!category) {
    return NextResponse.json(
      { success: false, message: `Category with ID ${id} not found` },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    time: new Date().toISOString(),
    message: `Category with ID ${id} found`,
    category: mapCategoryRecord(category)
  });
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = (await request.json()) as CategoryMutationPayload;

  try {
    const category = await prisma.category.update({
      where: { id: Number(id) },
      data: normalizeCategoryPayload(body),
      include: { _count: { select: { products: true } } }
    });

    return NextResponse.json({
      success: true,
      message: 'Category updated successfully',
      category: mapCategoryRecord(category)
    });
  } catch {
    return NextResponse.json(
      { success: false, message: `Category with ID ${id} not found` },
      { status: 404 }
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;

  try {
    await prisma.category.delete({
      where: { id: Number(id) }
    });

    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch {
    return NextResponse.json(
      { success: false, message: `Category with ID ${id} not found` },
      { status: 404 }
    );
  }
}
